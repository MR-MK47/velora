"""Velora Evaluator — Gemini Flash-Lite filmstrip self-evaluation."""

import json
import logging
import re
import subprocess
from pathlib import Path

from google import genai
import PIL.Image


def extract_filmstrip(video_path, output_dir):
    filmstrip_path = output_dir / 'filmstrip.png'

    duration_cmd = [
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(video_path)
    ]
    duration = float(subprocess.run(duration_cmd, capture_output=True, text=True).stdout.strip())
    interval = max(duration / 12, 1)

    cmd = [
        'ffmpeg', '-y',
        '-i', str(video_path),
        '-vf', f'fps=1/{interval:.1f},scale=480:270,tile=4x3',
        '-frames:v', '1',
        str(filmstrip_path)
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    logging.info('Filmstrip extracted: %s', filmstrip_path)
    return filmstrip_path


def evaluate_clip(video_path, filmstrip_path, gemini_model_name='gemini-2.0-flash-lite', secrets=None):
    api_key = secrets.get('gemini_api_key', '')
    client = genai.Client(api_key=api_key)

    img = PIL.Image.open(str(filmstrip_path))

    prompt = """Evaluate this video clip filmstrip. Return a valid JSON object with NO markdown formatting:

{
  "passed": true/false,
  "scores": {
    "visual": 0.0-1.0,
    "content": 0.0-1.0
  },
  "issues": ["issue1", "issue2"],
  "recommendation": "pass | retry | fail"
}

Score visual quality (artifacts, black frames, cropping, resolution, lighting).
Score content quality (hook presence, facial framing, engagement potential, pacing).
Set passed=true only if BOTH scores >= 0.6. Issues should list specific problems.
Recommendation: "pass" if passed, "retry" if minor issues, "fail" if unfixable."""

    response = client.models.generate_content(
        model=gemini_model_name,
        contents=[img, prompt]
    )

    text = response.text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)

    result = json.loads(text)

    assert 'passed' in result
    assert 'scores' in result
    assert 'visual' in result['scores']
    assert 'content' in result['scores']

    logging.info(
        'Evaluation: passed=%s, visual=%.2f, content=%.2f',
        result['passed'],
        result['scores']['visual'],
        result['scores']['content']
    )
    if result.get('issues'):
        for issue in result['issues']:
            logging.info('  Issue: %s', issue)

    return result


def should_retry(eval_result, attempt):
    return eval_result.get('passed') is False and attempt < 2
