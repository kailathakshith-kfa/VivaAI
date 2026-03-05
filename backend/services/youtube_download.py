import os
import re
import tempfile
import logging
import shutil

logger = logging.getLogger(__name__)


def is_youtube_url(url: str) -> bool:
    """Check if a URL is a valid YouTube URL."""
    patterns = [
        r'(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
        r'(https?://)?(www\.)?youtu\.be/[\w-]+',
        r'(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
    ]
    return any(re.match(p, url.strip()) for p in patterns)


def get_youtube_transcript(url: str) -> str:
    """
    Downloads YouTube audio using yt-dlp with an 'Android' identity 
    to bypass bot detection on cloud servers, then transcribes it.
    """
    import yt_dlp
    from .ai_models import transcribe_audio

    temp_dir = tempfile.mkdtemp()
    # We use a specific output template for yt-dlp
    output_template = os.path.join(temp_dir, "yt_audio.%(ext)s")

    # These settings help bypass "Bot Detection" on Render/Cloud IPs
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "quiet": True,
        "no_warnings": True,
        # CRITICAL: This makes yt-dlp act like an Android device 
        # which is less likely to be blocked by YouTube on cloud servers
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
                "skip": ["dash", "hls"]
            }
        },
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "192",
        }],
    }

    try:
        logger.info(f"Attempting to download YouTube via Android client: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the generated WAV file
        audio_path = None
        for f in os.listdir(temp_dir):
            if f.endswith(".wav"):
                audio_path = os.path.join(temp_dir, f)
                break

        if not audio_path:
            raise RuntimeError("Cloud block: YouTube is still blocking the request. Try uploading the video file instead.")

        logger.info(f"Audio downloaded. Starting transcription...")
        transcript = transcribe_audio(audio_path)
        return transcript

    except Exception as e:
        logger.error(f"YouTube Error: {str(e)}")
        raise RuntimeError(f"YouTube is blocking this request from the server. Please download the video and upload the file directly, as YouTube blocks automated tools on cloud hosting.") from e
    finally:
        # Clean up files
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
