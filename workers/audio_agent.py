"""Velora Audio Agent — AI-driven sound selection and mixing decisions."""

import json
import logging
import os
import shutil
import requests
from pathlib import Path
from typing import Optional

DRIVE_MOUNT = Path('/content/drive/MyDrive')
SOUND_BASE = 'Velora/sounds'


# ---------------------------------------------------------------------------
# Mounted Drive helpers (no service account needed)
# ---------------------------------------------------------------------------

def _mounted_path(*parts):
    return DRIVE_MOUNT.joinpath(*parts)


def read_manifest(folder_path):
    manifest_path = _mounted_path(folder_path, 'manifest.json')
    if not manifest_path.exists():
        logging.warning('No manifest.json at %s', manifest_path)
        return {'files': []}
    with open(manifest_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# SFX selection (AUDIO-01, D-11)
# ---------------------------------------------------------------------------

def select_sfx(transcript, groq_client, secrets):
    system_prompt = (
        "You are a sound designer analyzing a video transcript. "
        "Identify words or phrases that would benefit from sound effects. "
        "Return a JSON array of objects with 'word' and 'suggested_sfx' "
        "(a short description like 'whoosh', 'ding', 'transition swoosh')."
    )
    transcript_text = transcript if isinstance(transcript, str) else json.dumps(transcript)
    trigger_data = _groq_json(groq_client, system_prompt, f"Transcript: {transcript_text}")
    triggers = trigger_data if isinstance(trigger_data, list) else trigger_data.get('triggers', [])

    sfx_results = []

    # Load local cache
    cache_path = _mounted_path(SOUND_BASE, 'sfx', 'cache.json')
    cache = {}
    if cache_path.exists():
        with open(cache_path) as f:
            cache = json.load(f)

    for trigger in triggers[:5]:
        word = trigger.get('word', '')
        sfx_desc = trigger.get('suggested_sfx', 'transition')

        if sfx_desc in cache:
            logging.info('SFX cache hit: %s', sfx_desc)
            entry = cache[sfx_desc]
            if os.path.exists(entry.get('path', '')):
                sfx_results.append(entry)
                continue

        try:
            resp = requests.get(
                'https://freesound.org/apiv2/search/text/',
                params={
                    'query': sfx_desc,
                    'filter': 'duration:[0.5 TO 3.0]',
                    'page_size': 3,
                    'fields': 'id,name,duration,previews'
                },
                headers={'Authorization': f"Token {secrets.get('freesound_api_key', '')}"},
                timeout=15
            )
            resp.raise_for_status()
            sounds = resp.json().get('results', [])
            if sounds:
                preview_url = sounds[0]['previews']['preview-lq-mp3']
                sfx_data = requests.get(preview_url, timeout=15).content
                local_path = f"/tmp/sfx_{word}.mp3"
                with open(local_path, 'wb') as sf:
                    sf.write(sfx_data)

                entry = {
                    'path': local_path,
                    'timing': 0,
                    'description': sfx_desc
                }
                sfx_results.append(entry)
                cache[sfx_desc] = entry
                logging.info('SFX downloaded: %s -> %s', sfx_desc, local_path)
        except Exception as e:
            logging.warning('Freesound search failed for %s: %s', sfx_desc, e)

    return sfx_results


# ---------------------------------------------------------------------------
# Hook music selection (AUDIO-02, D-10)
# ---------------------------------------------------------------------------

def select_hook(transcript, groq_client):
    manifest = read_manifest(f"{SOUND_BASE}/hooks")
    if not manifest.get('files'):
        logging.warning('No hook tracks in manifest')
        return {}

    transcript_text = transcript if isinstance(transcript, str) else json.dumps(transcript)
    system_prompt = (
        "You are selecting hook music for a video clip. "
        "Choose the best matching track from the available manifest. "
        "Return JSON with 'filename' and 'reason'."
    )
    result = _groq_json(
        groq_client, system_prompt,
        f"Transcript: {transcript_text}\nManifest: {json.dumps(manifest)}"
    )

    filename = result.get('filename', '')
    selected = {}
    for f in manifest['files']:
        if f['filename'] == filename:
            selected = f
            break
    if not selected:
        selected = manifest['files'][0]

    src = _mounted_path(SOUND_BASE, 'hooks', selected['filename'])
    if src.exists():
        local_path = f"/tmp/hook_{selected['filename']}"
        shutil.copy2(str(src), local_path)
        return {'path': local_path, 'filename': selected['filename'], 'metadata': selected}

    return {}


# ---------------------------------------------------------------------------
# Background track selection (AUDIO-03, D-13)
# ---------------------------------------------------------------------------

def select_background(transcript, groq_client):
    manifest = read_manifest(f"{SOUND_BASE}/bg")
    if not manifest.get('files'):
        logging.warning('No background tracks in manifest')
        return {}

    transcript_text = transcript if isinstance(transcript, str) else json.dumps(transcript)
    system_prompt = (
        "You are selecting background ambient music for a video clip. "
        "Choose the best matching track from the available manifest. "
        "Return JSON with 'filename' and 'reason'."
    )
    result = _groq_json(
        groq_client, system_prompt,
        f"Transcript: {transcript_text}\nManifest: {json.dumps(manifest)}"
    )

    filename = result.get('filename', '')
    selected = {}
    for f in manifest['files']:
        if f['filename'] == filename:
            selected = f
            break
    if not selected:
        selected = manifest['files'][0]

    src = _mounted_path(SOUND_BASE, 'bg', selected['filename'])
    if src.exists():
        local_path = f"/tmp/bg_{selected['filename']}"
        shutil.copy2(str(src), local_path)
        return {'path': local_path, 'filename': selected['filename'], 'metadata': selected}

    return {}


# ---------------------------------------------------------------------------
# Volume mixing (D-12)
# ---------------------------------------------------------------------------

def determine_volumes(transcript, sfx_count, groq_client=None):
    transcript_text = transcript if isinstance(transcript, str) else json.dumps(transcript)
    system_prompt = (
        "You are a sound engineer. For a video clip, determine ideal relative volume levels "
        "(0.0-1.0) for dialogue, SFX, hook music, and background ambient. "
        "High-energy segments need louder hooks, speaking segments need clearer dialogue. "
        "Return JSON with keys: dialogue, sfx, hook, background."
    )
    if groq_client is None:
        logging.warning("No groq_client provided to determine_volumes, using defaults")
        return {'dialogue': 0.8, 'sfx': 0.5, 'hook': 0.3, 'background': 0.1}
    result = _groq_json(groq_client, system_prompt, f"Transcript: {transcript_text}")

    return {
        'dialogue': result.get('dialogue', 0.8),
        'sfx': result.get('sfx', 0.5),
        'hook': result.get('hook', 0.3),
        'background': result.get('background', 0.1),
    }


# ---------------------------------------------------------------------------
# Ensure sound library structure exists on mounted Drive
# ---------------------------------------------------------------------------

def ensure_sound_library():
    for sub in ('sfx', 'hooks', 'bg'):
        (DRIVE_MOUNT / SOUND_BASE / sub).mkdir(parents=True, exist_ok=True)
        logging.info('Ensured Drive folder: %s/%s', SOUND_BASE, sub)


# ---------------------------------------------------------------------------
# Shared Groq JSON helper
# ---------------------------------------------------------------------------

def _groq_json(groq_client, system_prompt, user_prompt):
    response = groq_client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ],
        response_format={'type': 'json_object'}
    )
    return json.loads(response.choices[0].message.content)
