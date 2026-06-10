#!/usr/bin/env python3
"""Velora Media Processing Worker — Segment Download, Transcription, Silence Cut."""

import json
import logging
import os
import random
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import groq
import yt_dlp
from supabase import create_client


# ---------------------------------------------------------------------------
# Plan 02-02 modules imported below (audio, render, evaluate, upload)
# ---------------------------------------------------------------------------
# These are imported at the end to avoid circular dependencies during
# initial module load.  The actual imports happen in _import_pipeline().
_pipeline_modules = None

def _import_pipeline():
    global _pipeline_modules
    if _pipeline_modules is not None:
        return _pipeline_modules
    from workers import audio_agent, renderer, evaluator, drive_uploader
    _pipeline_modules = {
        'select_sfx': audio_agent.select_sfx,
        'select_hook': audio_agent.select_hook,
        'select_background': audio_agent.select_background,
        'determine_volumes': audio_agent.determine_volumes,
        'render_vertical': renderer.render_vertical,
        'retry_render': renderer.retry_render,
        'evaluate_clip': evaluator.evaluate_clip,
        'extract_filmstrip': evaluator.extract_filmstrip,
        'should_retry': evaluator.should_retry,
        'upload_to_drive': drive_uploader.upload_to_drive,
        'build_drive_service': drive_uploader.build_drive_service,
    }
    return _pipeline_modules


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s'
    )


# ---------------------------------------------------------------------------
# Secret loading via Google Colab native Secrets manager
# ---------------------------------------------------------------------------

def load_colab_secrets():
    """Load all secrets from Google Colab's native Secrets manager.

    Supabase Vault is deprecated for worker secrets. All credentials are
    managed through Google Colab Secrets (google.colab.userdata).

    Returns:
        dict: Mapped secrets with lowercase keys matching internal usage.

    Raises:
        SystemExit: If any required secret is missing in the Colab environment.
    """
    try:
        from google.colab import userdata
        from google.colab.errors import SecretNotFoundError
    except ImportError:
        logging.fatal("google.colab not available — this worker runs exclusively in Google Colab")
        sys.exit(1)

    REQUIRED_SECRETS = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'GEMINI_API_KEY',
        'GROQ_API_KEY',
        'FREESOUND_API_KEY',
        'GCP_SERVICE_ACCOUNT',
    ]

    secrets = {}
    for name in REQUIRED_SECRETS:
        try:
            value = userdata.get(name)
        except SecretNotFoundError:
            logging.fatal(
                "Missing required Colab secret: '%s'. "
                "Add it via Runtime → Secrets in the Colab UI.", name
            )
            sys.exit(1)

        # Map Colab secret names to internal dict keys
        if name == 'GCP_SERVICE_ACCOUNT':
            try:
                secrets['drive_service_account_json'] = json.loads(value)
            except json.JSONDecodeError as e:
                logging.fatal(
                    "Colab secret 'GCP_SERVICE_ACCOUNT' is not valid JSON: %s", e
                )
                sys.exit(1)
        else:
            secrets[name.lower()] = value

    logging.info("Loaded %d secrets from Colab Secrets manager", len(secrets))
    return secrets


# ---------------------------------------------------------------------------
# Supabase bootstrap (uses secrets dict instead of env vars)
# ---------------------------------------------------------------------------

def bootstrap_supabase(secrets):
    supabase_url = secrets.get('supabase_url')
    service_role = secrets.get('supabase_service_role_key')
    if not supabase_url or not service_role:
        raise ValueError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in secrets dict')
    supabase = create_client(supabase_url, service_role)
    supabase.table('clips').select('id').limit(1).execute()
    logging.info('Supabase connection OK')
    return supabase


# ---------------------------------------------------------------------------
# Clip fetching & status updates
# ---------------------------------------------------------------------------

def fetch_queued_clips(supabase):
    queued = supabase.table('clips').select('*').eq('status', 'queued').execute()
    clips = list(queued.data)

    stale = supabase.table('clips').select('*').eq('status', 'processing').execute()
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
    for clip in stale.data:
        updated = clip.get('updated_at')
        if updated:
            try:
                updated_dt = datetime.fromisoformat(updated.replace('Z', '+00:00'))
                if updated_dt < cutoff:
                    step_log = json.loads(clip.get('step', '{}')) if clip.get('step') else {}
                    last_step = step_log.get('last_stage', '')
                    status_map = {
                        'downloaded': 'downloading',
                        'transcribed': 'transcribing',
                        'silence_cut': 'mixing',
                    }
                    new_status = status_map.get(last_step, 'downloading')
                    supabase.table('clips').update({
                        'status': new_status,
                        'step': json.dumps({**step_log, 'resumed': True}),
                        'updated_at': 'now()'
                    }).eq('id', clip['id']).execute()
                    clip['status'] = new_status
                    clips.append(clip)
                    logging.info('Resumed stale clip %s from step %s', clip['id'], last_step)
            except (ValueError, KeyError):
                pass

    logging.info('Fetched %d clips to process', len(clips))
    return clips


def update_status(supabase, clip_id, status, step=None, error=None):
    update_dict = {'status': status, 'updated_at': 'now()'}
    if step:
        update_dict['step'] = step
    if error:
        update_dict['error_message'] = error
        update_dict['status'] = 'error'
    supabase.table('clips').update(update_dict).eq('id', clip_id).execute()
    logging.info('Clip %s -> %s', clip_id, status)


# ---------------------------------------------------------------------------
# Retry-then-fallback pattern (D-01)
# ---------------------------------------------------------------------------

def with_retry_and_fallback(stage_fn, fallback_fn, *args, max_retries=3):
    for attempt in range(max_retries):
        try:
            return stage_fn(*args)
        except Exception as e:
            logging.warning('Attempt %d/%d failed: %s', attempt + 1, max_retries, e)
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            logging.info('Retries exhausted, trying fallback...')
            try:
                return fallback_fn(*args)
            except Exception as fallback_e:
                raise RuntimeError(
                    f'Stage failed after {max_retries} retries and fallback: {fallback_e}'
                )


# ---------------------------------------------------------------------------
# Pipeline stage: Download Segment (PIPE-02)
# ---------------------------------------------------------------------------

def download_segment(clip, working_dir, secrets):
    youtube_url = (clip.get('campaigns') or {}).get('youtube_url') or clip.get('youtube_url')
    if not youtube_url:
        raise ValueError('No youtube_url found for clip')

    start_ts = float(clip['start_ts'])
    end_ts = float(clip['end_ts'])
    segment_path = working_dir / 'segment.mp4'

    def try_ytdlp_sections():
        ydl_opts = {
            'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            'outtmpl': str(segment_path),
            'download_ranges': [{'start_time': start_ts, 'end_time': end_ts}],
            'force_keyframes_at_cuts': True,
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        if not segment_path.exists():
            raise FileNotFoundError(f'Segment not created at {segment_path}')
        return segment_path

    def try_full_download_and_cut():
        full_path = working_dir / 'full.mp4'
        ydl_opts = {
            'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            'outtmpl': str(full_path),
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])
        if not full_path.exists():
            raise FileNotFoundError(f'Full video not created at {full_path}')

        duration = end_ts - start_ts
        cmd = [
            'ffmpeg', '-y',
            '-ss', str(start_ts),
            '-i', str(full_path),
            '-t', str(duration),
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-avoid_negative_ts', 'make_zero',
            str(segment_path)
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        if not segment_path.exists():
            raise FileNotFoundError(f'Trimmed segment not created at {segment_path}')
        return segment_path

    time.sleep(random.uniform(2, 5))
    return with_retry_and_fallback(try_ytdlp_sections, try_full_download_and_cut)


# ---------------------------------------------------------------------------
# Pipeline stage: Transcribe Audio (PIPE-03)
# ---------------------------------------------------------------------------

def transcribe_audio(segment_path, secrets):
    def try_groq():
        client = groq.Client(api_key=secrets['groq_api_key'])
        with open(segment_path, 'rb') as f:
            transcript = client.audio.transcriptions.create(
                file=(segment_path.name, f.read()),
                model='whisper-large-v3',
                response_format='verbose_json',
                timestamp_granularities=['word', 'segment']
            )
        return transcript

    def try_whisperx():
        import whisperx
        device = 'cuda' if os.path.exists('/usr/local/cuda') else 'cpu'
        model = whisperx.load_model('large-v3', device=device,
                                    compute_type='float16' if device == 'cuda' else 'float32')
        result = model.transcribe(str(segment_path))
        align_model, metadata = whisperx.load_align_model(language_code='en', device=device)
        result = whisperx.align(result['segments'], align_model, metadata,
                                str(segment_path), device=device)
        return result

    return with_retry_and_fallback(try_groq, try_whisperx)


# ---------------------------------------------------------------------------
# Pipeline stage: Cut Silence (PIPE-04)
# ---------------------------------------------------------------------------

def detect_silence(segment_path):
    cmd = [
        'ffmpeg', '-i', str(segment_path),
        '-af', 'silencedetect=noise=-30dB:d=0.5',
        '-f', 'null', '-'
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    silence_lines = [l for l in result.stderr.split('\n') if 'silence_' in l]
    if silence_lines:
        logging.debug('Silence regions: %s', silence_lines)
    return silence_lines


def cut_silence(segment_path, working_dir):
    cut_path = working_dir / 'cut_segment.mp4'
    detect_silence(segment_path)

    cmd = [
        'ffmpeg', '-y',
        '-i', str(segment_path),
        '-af',
        'silenceremove=start_periods=1:start_duration=1:start_threshold=-30dB:'
        'stop_periods=1:stop_duration=1:stop_threshold=-30dB:'
        'stop_silence_operation=trim+delete,'
        'afade=t=in:ss=0:d=0.03,'
        'afade=t=out:st=duration-0.03:d=0.03',
        '-c:v', 'copy',
        '-c:a', 'aac',
        str(cut_path)
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)

    if not cut_path.exists():
        raise FileNotFoundError(f'Silence-cut segment not created at {cut_path}')

    logging.info('Silence cut: %s -> %s', segment_path.name, cut_path.name)
    return cut_path


# ---------------------------------------------------------------------------
# Per-clip processing pipeline
# ---------------------------------------------------------------------------

def process_clip(clip, supabase, secrets, drive_service, groq_client):
    clip_id = clip['id']
    working_dir = Path('/content/clips') / clip_id
    working_dir.mkdir(parents=True, exist_ok=True)

    m = _import_pipeline()

    step_log = {}

    try:
        update_status(supabase, clip_id, 'downloading')
        segment_path = download_segment(clip, working_dir, secrets)
        step_log['last_stage'] = 'downloaded'
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        update_status(supabase, clip_id, 'transcribing')
        transcript = transcribe_audio(segment_path, secrets)
        step_log['last_stage'] = 'transcribed'
        step_log['has_transcript'] = True
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        update_status(supabase, clip_id, 'mixing')
        cut_path = cut_silence(segment_path, working_dir)
        step_log['last_stage'] = 'silence_cut'
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        # Stage 4: Audio selection (AUDIO-01, AUDIO-02, AUDIO-03)
        update_status(supabase, clip_id, 'mixing', step='selecting audio')
        audio_layers = {
            'sfx': m['select_sfx'](transcript, drive_service, groq_client, secrets),
            'hook': m['select_hook'](transcript, drive_service, groq_client),
            'background': m['select_background'](transcript, drive_service, groq_client),
        }
        volumes = m['determine_volumes'](transcript, len(audio_layers['sfx']), groq_client)
        step_log['last_stage'] = 'audio_selected'
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        # Stage 5: Render vertical clip (AUDIO-04)
        update_status(supabase, clip_id, 'rendering')
        output_path = working_dir / 'final.mp4'
        render_path = m['render_vertical'](cut_path, output_path, audio_layers, volumes, clip)
        step_log['last_stage'] = 'rendered'
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        # Stage 6: Self-evaluate (EVAL-01)
        update_status(supabase, clip_id, 'evaluating')
        filmstrip_path = m['extract_filmstrip'](render_path, working_dir)
        eval_result = m['evaluate_clip'](render_path, filmstrip_path,
                                          'gemini-2.0-flash-lite', secrets)
        step_log['eval_result'] = {k: v for k, v in eval_result.items() if k != 'issues'}

        # Retry loop on failed evaluation (D-17)
        attempt = 0
        while m['should_retry'](eval_result, attempt):
            attempt += 1
            logging.info('Evaluation failed, retry %d/2 with tweaks...', attempt)
            render_path = m['retry_render'](cut_path, output_path, audio_layers,
                                            volumes, eval_result, attempt)
            filmstrip_path = m['extract_filmstrip'](render_path, working_dir)
            eval_result = m['evaluate_clip'](render_path, filmstrip_path,
                                              'gemini-2.0-flash-lite', secrets)
            step_log['eval_result'] = {k: v for k, v in eval_result.items() if k != 'issues'}

        if not eval_result.get('passed', False):
            logging.warning('Clip %s failed evaluation after %d retries. Flagging.', clip_id, attempt)

        step_log['last_stage'] = 'evaluated'
        supabase.table('clips').update({
            'step': json.dumps(step_log)
        }).eq('id', clip_id).execute()

        # Stage 7: Upload to Drive (EVAL-02)
        update_status(supabase, clip_id, 'uploading')
        drive_url = m['upload_to_drive'](
            render_path, clip,
            secrets.get('drive_service_account_json', {})
        )

        # Mark as done
        update_status(supabase, clip_id, 'done')
        supabase.table('clips').update({
            'drive_url': drive_url,
            'step': json.dumps({**step_log, 'last_stage': 'done',
                                'eval_score': eval_result.get('scores', {})})
        }).eq('id', clip_id).execute()

    except Exception as e:
        logging.error('Clip %s failed: %s', clip_id, e)
        update_status(supabase, clip_id, 'error', error=str(e))
        return False

    finally:
        if working_dir.exists():
            import shutil
            shutil.rmtree(working_dir, ignore_errors=True)

    return True


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def process_all_clips(supabase, secrets):
    m = _import_pipeline()
    drive_service_account = secrets.get('drive_service_account_json', {})
    drive_service = m['build_drive_service'](drive_service_account)
    groq_client = groq.Client(api_key=secrets.get('groq_api_key', ''))

    clips = fetch_queued_clips(supabase)
    succeeded = 0
    failed = 0

    for clip in clips:
        try:
            ok = process_clip(clip, supabase, secrets, drive_service, groq_client)
            if ok:
                succeeded += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
            clip_id = clip.get('id', 'unknown')
            logging.error('Unhandled error processing clip %s: %s', clip_id, e)
            try:
                update_status(supabase, clip_id, 'error', error=str(e))
            except Exception:
                pass

    logging.info('Processed %d clips: %d succeeded, %d failed', len(clips), succeeded, failed)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    setup_logging()
    try:
        secrets = load_colab_secrets()
        supabase = bootstrap_supabase(secrets)
        process_all_clips(supabase, secrets)
    except Exception as e:
        logging.fatal('Worker fatal error: %s', e)
        sys.exit(1)


if __name__ == '__main__':
    main()
