import subprocess
import os
import tempfile


def extract_audio(video_path: str) -> str:
    """
    Extracts audio from a video file and saves it as a WAV file.
    Uses ffmpeg directly via subprocess (more reliable on Render).
    Returns the path to the extracted WAV file.
    """
    temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_audio.close()
    audio_path = temp_audio.name

    try:
        subprocess.run(
            [
                "ffmpeg", "-i", video_path,
                "-ar", "16000",        # 16kHz sample rate (required by Whisper)
                "-ac", "1",            # Mono channel
                "-acodec", "pcm_s16le",
                "-vn",                 # No video stream
                "-y",                  # Overwrite output
                audio_path,
            ],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise RuntimeError(f"FFmpeg audio extraction failed: {e.stderr.decode()}") from e

    return audio_path
