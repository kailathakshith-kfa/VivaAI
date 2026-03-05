import re
import logging
import requests

logger = logging.getLogger(__name__)

# Public Invidious instances that provide caption APIs
INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
    "https://invidious.privacyredirect.com",
]


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


def _fetch_via_invidious(video_id: str) -> str:
    """Try fetching captions via Invidious public API instances."""
    for instance in INVIDIOUS_INSTANCES:
        try:
            # First get available captions
            captions_url = f"{instance}/api/v1/captions/{video_id}"
            resp = requests.get(captions_url, timeout=10)
            if resp.status_code != 200:
                continue

            captions_data = resp.json()
            captions_list = captions_data.get("captions", [])
            if not captions_list:
                continue

            # Prefer English, then auto-generated, then any
            target = None
            for cap in captions_list:
                label = cap.get("label", "").lower()
                lang = cap.get("language_code", "")
                if lang.startswith("en"):
                    target = cap
                    break
            if not target:
                target = captions_list[0]  # Fall back to first available

            # Fetch the actual caption text
            caption_url = target.get("url", "")
            if not caption_url.startswith("http"):
                caption_url = f"{instance}{caption_url}"

            # Request as plain text format
            if "?" in caption_url:
                caption_url += "&fmt=json3"
            else:
                caption_url += "?fmt=json3"

            cap_resp = requests.get(caption_url, timeout=15)
            if cap_resp.status_code != 200:
                # Try vtt format
                vtt_url = caption_url.replace("fmt=json3", "fmt=vtt")
                cap_resp = requests.get(vtt_url, timeout=15)
                if cap_resp.status_code == 200:
                    return _parse_vtt(cap_resp.text)
                continue

            # Parse json3 format
            json_data = cap_resp.json()
            events = json_data.get("events", [])
            text_parts = []
            for event in events:
                segs = event.get("segs", [])
                for seg in segs:
                    t = seg.get("utf8", "").strip()
                    if t and t != "\n":
                        text_parts.append(t)

            text = " ".join(text_parts).strip()
            if text:
                logger.info(f"Got transcript via Invidious ({instance}): {len(text)} chars")
                return text

        except Exception as e:
            logger.warning(f"Invidious instance {instance} failed: {e}")
            continue

    return ""


def _parse_vtt(vtt_text: str) -> str:
    """Parse VTT subtitle format into plain text."""
    lines = vtt_text.strip().split("\n")
    text_parts = []
    for line in lines:
        line = line.strip()
        # Skip headers, empty lines, and timestamp lines
        if not line or line.startswith("WEBVTT") or line.startswith("Kind:") or \
           line.startswith("Language:") or "-->" in line or line.isdigit():
            continue
        # Remove HTML tags
        clean = re.sub(r'<[^>]+>', '', line).strip()
        if clean:
            text_parts.append(clean)
    return " ".join(text_parts)


def _fetch_via_transcript_api(video_id: str) -> str:
    """Try fetching via youtube-transcript-api as a fallback."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.fetch(video_id)
        text = " ".join(
            entry.text.strip() for entry in transcript_list if entry.text.strip()
        )
        return text
    except Exception as e:
        logger.warning(f"youtube-transcript-api failed: {e}")
        return ""


def get_youtube_transcript(url: str) -> str:
    """
    Fetches the transcript of a YouTube video.
    Tries multiple methods:
    1. Invidious public API (works from cloud servers)
    2. youtube-transcript-api (fallback)
    """
    video_id = extract_video_id(url)
    logger.info(f"Fetching transcript for video ID: {video_id}")

    # Method 1: Invidious API
    transcript = _fetch_via_invidious(video_id)
    if transcript:
        return transcript

    # Method 2: youtube-transcript-api
    transcript = _fetch_via_transcript_api(video_id)
    if transcript:
        return transcript

    raise RuntimeError(
        "Could not fetch the transcript for this video. "
        "The video may not have captions available, or all transcript services are currently unavailable. "
        "Please try a different video or use the file upload option."
    )
