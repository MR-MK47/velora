"""Velora Renderer — moviepy vertical clip assembly and export."""

import logging
from pathlib import Path

from moviepy import VideoFileClip, AudioFileClip, CompositeAudioClip, afx


def render_vertical(segment_path, output_path, audio_layers, volumes, clip_info=None):
    video = VideoFileClip(str(segment_path))

    audio_clips = []

    original_audio = video.audio
    if original_audio:
        original_audio = original_audio.with_effects([afx.MultiplyVolume(volumes.get('dialogue', 0.8))])
        audio_clips.append(original_audio)

    for sfx in audio_layers.get('sfx', []):
        sfx_clip = AudioFileClip(sfx['path'])
        sfx_clip = sfx_clip.with_effects([afx.MultiplyVolume(volumes.get('sfx', 0.5))])
        sfx_clip = sfx_clip.with_start(sfx.get('timing', 0))
        audio_clips.append(sfx_clip)

    hook_path = audio_layers.get('hook', {}).get('path')
    if hook_path:
        hook_clip = AudioFileClip(hook_path)
        hook_clip = hook_clip.with_duration(video.duration)
        hook_clip = hook_clip.with_effects([afx.MultiplyVolume(volumes.get('hook', 0.3))])
        audio_clips.append(hook_clip)

    bg_path = audio_layers.get('background', {}).get('path')
    if bg_path:
        bg_clip = AudioFileClip(bg_path)
        bg_clip = bg_clip.with_duration(video.duration)
        bg_clip = bg_clip.with_effects([afx.MultiplyVolume(volumes.get('background', 0.1))])
        audio_clips.append(bg_clip)

    if audio_clips:
        final_audio = CompositeAudioClip(audio_clips)
        video = video.with_audio(final_audio)

    target_w, target_h = 1080, 1920
    video_w, video_h = video.size

    scale_factor = target_h / video_h
    new_w = int(video_w * scale_factor)
    if new_w < target_w:
        scale_factor = target_w / video_w
        new_h = int(video_h * scale_factor)
        video = video.resized(height=new_h)
        video = video.cropped(x_center=video.w / 2, width=target_w,
                              y_center=video.h / 2, height=target_h)
    else:
        video = video.resized(height=target_h)
        video = video.cropped(x_center=video.w / 2, width=target_w)

    video.write_videofile(
        str(output_path),
        codec='libx264',
        audio_codec='aac',
        fps=30,
        threads=2,
        preset='medium',
        logger=None
    )

    video.close()
    size_mb = output_path.stat().st_size / 1024 / 1024
    logging.info('Rendered vertical clip: %s (%.1f MB)', output_path, size_mb)
    return output_path


def retry_render(segment_path, output_path, audio_layers, volumes, eval_result, attempt=1):
    if attempt == 1:
        volumes['hook'] = min(volumes.get('hook', 0.3) + 0.1, 1.0)
        volumes['background'] = max(volumes.get('background', 0.1) - 0.05, 0.0)
        logging.info('Retry render attempt %d: adjusted volumes', attempt)
    elif attempt == 2:
        for sfx in audio_layers.get('sfx', []):
            sfx['timing'] = sfx.get('timing', 0) + 2.0
        logging.info('Retry render attempt %d: shifted SFX timing', attempt)

    return render_vertical(segment_path, output_path, audio_layers, volumes, {'attempt': attempt})
