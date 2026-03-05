import re
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


def extract_video_id(url: str) -> str:
    """Extract the video ID from a YouTube URL."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([\w-]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def get_youtube_transcript(url: str) -> str:
    """
    Fetches the transcript of a YouTube video using youtube-transcript-api.
    Falls back to auto-generated captions if manual ones aren't available.
    Returns the full transcript text.
    """
    from youtube_transcript_api import YouTubeTranscriptApi

    video_id = extract_video_id(url)
    logger.info(f"Fetching transcript for video ID: {video_id}")

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.fetch(video_id)

        # Combine all text segments
        full_text = " ".join(
            entry.text.strip()
            for entry in transcript_list
            if entry.text.strip()
        )

        if not full_text:
            raise RuntimeError("Transcript was empty.")

        logger.info(f"Transcript fetched: {len(full_text)} characters")
        return full_text

    except Exception as e:
        error_msg = str(e)
        if "TranscriptsDisabled" in error_msg:
            raise RuntimeError(
                "This video has transcripts/captions disabled. "
                "Please try a video with captions enabled."
            ) from e
        elif "NoTranscriptFound" in error_msg:
            raise RuntimeError(
                "No transcript found for this video. "
                "Please try a video with auto-generated or manual captions."
            ) from e
        else:
            raise RuntimeError(f"Failed to fetch transcript: {error_msg}") from e
