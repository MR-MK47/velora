"""Velora Audio Agent — AI-driven sound selection and mixing decisions."""

import json
import logging
import os
import io
import requests
from pathlib import Path
from typing import Optional

SOUND_BASE = 'Velora/sounds'


# ---------------------------------------------------------------------------
# Drive helpers
# ---------------------------------------------------------------------------

def _find_folder_id(drive_service, path):
    parent_id = 'root'
    for part in path.split('/'):
        query = (
            f"name='{part}' and '{parent_id}' in parents "
            f"and trashed=false and mimeType='application/vnd.google-apps.folder'"
        )
        results = drive_service.files().list(q=query, fields='files(id)').execute()
        files = results.get('files', [])
        if not files:
            return None
        parent_id = files[0]['id']
    return parent_id


def read_manifest(drive_service, folder_path):
    folder_id = _find_folder_id(drive_service, folder_path)
    if not folder_id:
        logging.warning('Sound folder not found: %s', folder_path)
        return {'files': []}

    query = f"name='manifest.json' and '{folder_id}' in parents and trashed=false"
    results = drive_service.files().list(q=query, fields='files(id)').execute()
    files = results.get('files', [])
    if not files:
        logging.warning('No manifest.json in %s', folder_path)
        return {'files': []}

    from googleapiclient.http import MediaIoBaseDownload
    request = drive_service.files().get_media(fileId=files[0]['id'])
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return json.loads(fh.getvalue().decode('utf-8'))


def _download_drive_file(drive_service, file_id, local_path):
    request = drive_service.files().get_media(fileId=file_id)
    with open(local_path, 'wb') as f:
        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(f, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
    return local_path


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


# ---------------------------------------------------------------------------
# SFX selection (AUDIO-01, D-11)
# ---------------------------------------------------------------------------

def select_sfx(transcript, drive_service, groq_client, secrets):
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

    # Load Drive cache
    cache_folder = f"{SOUND_BASE}/sfx"
    cache_folder_id = _find_folder_id(drive_service, cache_folder)
    cache = {}
    if cache_folder_id:
        cache_query = f"name='cache.json' and '{cache_folder_id}' in parents and trashed=false"
        cache_files = drive_service.files().list(q=cache_query, fields='files(id)').execute()
        if cache_files.get('files'):
            cache_blob = _download_drive_file(
                drive_service, cache_files['files'][0]['id'],
                '/tmp/sfx_cache.json'
            )
            with open(cache_blob) as f:
                cache = json.load(f)

    for trigger in triggers[:5]:
        word = trigger.get('word', '')
        sfx_desc = trigger.get('suggested_sfx', 'transition')

        # Check cache first
        if sfx_desc in cache:
            logging.info('SFX cache hit: %s', sfx_desc)
            sfx_results.append({
                'path': cache[sfx_desc].get('local_path', ''),
                'timing': 0,
                'description': cache[sfx_desc].get('description', sfx_desc)
            })
            continue

        # Search Freesound
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

def select_hook(transcript, drive_service, groq_client):
    manifest = read_manifest(drive_service, f"{SOUND_BASE}/hooks")
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

    # Download from Drive
    folder_id = _find_folder_id(drive_service, f"{SOUND_BASE}/hooks")
    if folder_id:
        query = f"name='{selected['filename']}' and '{folder_id}' in parents and trashed=false"
        files = drive_service.files().list(q=query, fields='files(id)').execute()
        if files.get('files'):
            local_path = f"/tmp/hook_{selected['filename']}"
            _download_drive_file(drive_service, files['files'][0]['id'], local_path)
            return {'path': local_path, 'filename': selected['filename'], 'metadata': selected}

    return {}


# ---------------------------------------------------------------------------
# Background track selection (AUDIO-03, D-13)
# ---------------------------------------------------------------------------

def select_background(transcript, drive_service, groq_client):
    manifest = read_manifest(drive_service, f"{SOUND_BASE}/bg")
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

    folder_id = _find_folder_id(drive_service, f"{SOUND_BASE}/bg")
    if folder_id:
        query = f"name='{selected['filename']}' and '{folder_id}' in parents and trashed=false"
        files = drive_service.files().list(q=query, fields='files(id)').execute()
        if files.get('files'):
            local_path = f"/tmp/bg_{selected['filename']}"
            _download_drive_file(drive_service, files['files'][0]['id'], local_path)
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
# Ensure sound library structure exists on Drive
# ---------------------------------------------------------------------------

def ensure_sound_library(drive_service):
    for sub in ('sfx', 'hooks', 'bg'):
        folder_path = f"{SOUND_BASE}/{sub}"
        folder_id = _find_folder_id(drive_service, folder_path)
        if not folder_id:
            parent_id = _find_folder_id(drive_service, SOUND_BASE)
            if not parent_id:
                parent_id = drive_service.files().create(
                    body={
                        'name': 'sounds',
                        'mimeType': 'application/vnd.google-apps.folder',
                        'parents': [_find_folder_id(drive_service, 'Velora') or 'root']
                    },
                    fields='id'
                ).execute()['id']
            drive_service.files().create(
                body={
                    'name': sub,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [parent_id]
                },
                fields='id'
            ).execute()
            logging.info('Created Drive folder: %s', folder_path)
