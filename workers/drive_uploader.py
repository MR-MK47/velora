"""Velora Drive Uploader — Google Drive folder management and file upload."""

import logging
from pathlib import Path
from typing import Optional

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


def build_drive_service(service_account_json):
    creds = Credentials.from_service_account_info(
        service_account_json,
        scopes=['https://www.googleapis.com/auth/drive']
    )
    service = build('drive', 'v3', credentials=creds)
    return service


def ensure_folder_path(service, folder_parts, start_parent='root'):
    parent_id = start_parent
    for part in folder_parts:
        query = (
            f"name='{part}' and '{parent_id}' in parents "
            f"and trashed=false and mimeType='application/vnd.google-apps.folder'"
        )
        results = service.files().list(q=query, fields='files(id)').execute()
        files = results.get('files', [])
        if files:
            parent_id = files[0]['id']
        else:
            file_metadata = {
                'name': part,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parent_id]
            }
            file = service.files().create(body=file_metadata, fields='id').execute()
            parent_id = file['id']
            logging.info('Created Drive folder: %s (id: %s)', part, parent_id)
    return parent_id


def upload_file(service, local_path, folder_id, filename):
    media = MediaFileUpload(str(local_path), mimetype='video/mp4', resumable=True)
    file = service.files().create(
        body={'name': filename, 'parents': [folder_id]},
        media_body=media,
        fields='id, webViewLink'
    ).execute()
    logging.info('Uploaded %s to Drive (id: %s)', filename, file['id'])
    return file


def set_public_sharing(service, file_id):
    permission = {
        'type': 'anyone',
        'role': 'reader'
    }
    service.permissions().create(fileId=file_id, body=permission).execute()
    logging.info('Set public sharing on file: %s', file_id)


def upload_to_drive(local_path, clip, service_account_json, root_folder_id=None):
    service = build_drive_service(service_account_json)

    campaign_title = (clip.get('campaigns') or {}).get('title', 'Unknown Campaign')
    clip_id = clip['id']

    folder_parts = ['Velora', campaign_title, clip_id, 'v1']
    folder_id = ensure_folder_path(service, folder_parts, start_parent=root_folder_id)

    file = upload_file(service, local_path, folder_id, 'final.mp4')
    set_public_sharing(service, file['id'])

    return file['webViewLink']
