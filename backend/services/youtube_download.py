import os
import re
import tempfile
import logging

logger = logging.getLogger(__name__)


def is_youtube_url(url: str) -> bool:
    """Check if a URL is a valid YouTube URL."""
    patterns = [
        r'(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]+',
        r'(https?://)?(www\.)?youtu\.be/[\w-]+',
        r'(https?://)?(www\.)?youtube\.com/shorts/[\w-]+',
    ]
    return any(re.match(p, url.strip()) for p in patterns)


def download_youtube_video(url: str) -> str:
    """
    Downloads a YouTube video using yt-dlp and returns the path to the file.
    Downloads the best audio-only format to save time and bandwidth.
    """
    import yt_dlp

    temp_dir = tempfile.mkdtemp()
    output_path = os.path.join(temp_dir, "youtube_audio.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "quiet": True,
        "no_warnings": True,
        "extract_audio": True,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "192",
        }],
        # Limit to 15 minutes max
        "match_filter": yt_dlp.utils.match_filter_func("duration < 900"),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logger.info(f"Downloading audio from YouTube: {url}")
            info = ydl.extract_info(url, download=True)
            title = info.get("title", "Unknown")
            logger.info(f"Downloaded: {title}")

        # Find the output file (will be .wav after postprocessing)
        for f in os.listdir(temp_dir):
            if f.endswith(".wav"):
                return os.path.join(temp_dir, f)

        # Fallback: return whatever file was downloaded
        files = os.listdir(temp_dir)
        if files:
            return os.path.join(temp_dir, files[0])

        raise RuntimeError("yt-dlp did not produce any output file.")

    except Exception as e:
        # Clean up on error
        import shutil
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError(f"Failed to download YouTube video: {str(e)}") from e
