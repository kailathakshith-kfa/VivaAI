import re
import logging
import requests

logger = logging.getLogger(__name__)

# Invidious public instances
INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
    "https://invidious.privacyredirect.com",
]

# Piped public instances (more actively maintained)
PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.in.projectsegfau.lt",
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


def _fetch_via_piped(video_id: str) -> str:
    """Try fetching captions via Piped API instances."""
    for instance in PIPED_INSTANCES:
        try:
            # Get stream info which includes subtitle URLs
            resp = requests.get(
                f"{instance}/streams/{video_id}",
                timeout=15,
                headers={"User-Agent": "VivaAI/1.0"}
            )
            if resp.status_code != 200:
                logger.warning(f"Piped {instance} returned {resp.status_code}")
                continue

            data = resp.json()
            subtitles = data.get("subtitles", [])

            if not subtitles:
                logger.warning(f"Piped {instance}: no subtitles found")
                continue

            # Find English subtitles
            target_url = None
            for sub in subtitles:
                code = sub.get("code", "")
                if code.startswith("en"):
                    target_url = sub.get("url", "")
                    break
            if not target_url and subtitles:
                target_url = subtitles[0].get("url", "")

            if not target_url:
                continue

            # Fetch the subtitle content (VTT format)
            sub_resp = requests.get(target_url, timeout=15)
            if sub_resp.status_code != 200:
                continue

            text = _parse_vtt(sub_resp.text)
            if text:
                logger.info(f"Got transcript via Piped ({instance}): {len(text)} chars")
                return text

        except Exception as e:
            logger.warning(f"Piped instance {instance} failed: {e}")
            continue

    return ""


def _fetch_via_invidious(video_id: str) -> str:
    """Try fetching captions via Invidious public API instances."""
    for instance in INVIDIOUS_INSTANCES:
        try:
            captions_url = f"{instance}/api/v1/captions/{video_id}"
            resp = requests.get(
                captions_url,
                timeout=10,
                headers={"User-Agent": "VivaAI/1.0"}
            )
            if resp.status_code != 200:
                logger.warning(f"Invidious {instance} returned {resp.status_code}")
                continue

            captions_data = resp.json()
            captions_list = captions_data.get("captions", [])
            if not captions_list:
                logger.warning(f"Invidious {instance}: no captions found")
                continue

            # Prefer English
            target = None
            for cap in captions_list:
                lang = cap.get("language_code", "")
                if lang.startswith("en"):
                    target = cap
                    break
            if not target:
                target = captions_list[0]

            # Fetch caption text
            caption_url = target.get("url", "")
            if not caption_url.startswith("http"):
                caption_url = f"{instance}{caption_url}"

            # Try VTT format
            if "?" in caption_url:
                vtt_url = caption_url + "&fmt=vtt"
            else:
                vtt_url = caption_url + "?fmt=vtt"

            cap_resp = requests.get(vtt_url, timeout=15)
            if cap_resp.status_code == 200:
                text = _parse_vtt(cap_resp.text)
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
    seen = set()  # Deduplicate repeated lines
    for line in lines:
        line = line.strip()
        if not line or line.startswith("WEBVTT") or line.startswith("Kind:") or \
           line.startswith("Language:") or "-->" in line or line.isdigit() or \
           line.startswith("NOTE"):
            continue
        clean = re.sub(r'<[^>]+>', '', line).strip()
        if clean and clean not in seen:
            text_parts.append(clean)
            seen.add(clean)
    return " ".join(text_parts)


def _fetch_via_transcript_api(video_id: str) -> str:
    """Try fetching via youtube-transcript-api as last fallback."""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.fetch(video_id)
        text = " ".join(
            entry.text.strip() for entry in transcript_list if entry.text.strip()
        )
        if text:
            logger.info(f"Got transcript via youtube-transcript-api: {len(text)} chars")
        return text
    except Exception as e:
        logger.warning(f"youtube-transcript-api failed: {e}")
        return ""


def get_youtube_transcript(url: str) -> str:
    """
    Fetches the transcript of a YouTube video.
    Tries multiple methods in order:
    1. Piped API (most reliable from cloud)
    2. Invidious API (backup mirrors)
    3. youtube-transcript-api (direct, often blocked on cloud)
    """
    video_id = extract_video_id(url)
    logger.info(f"Fetching transcript for video: {video_id}")

    # Method 1: Piped API
    logger.info("Trying Piped API...")
    transcript = _fetch_via_piped(video_id)
    if transcript:
        return transcript

    # Method 2: Invidious API
    logger.info("Trying Invidious API...")
    transcript = _fetch_via_invidious(video_id)
    if transcript:
        return transcript

    # Method 3: Direct youtube-transcript-api
    logger.info("Trying youtube-transcript-api...")
    transcript = _fetch_via_transcript_api(video_id)
    if transcript:
        return transcript

    raise RuntimeError(
        "Could not fetch the transcript for this video. "
        "The video may not have captions, or YouTube transcript services "
        "are currently unavailable. Please try the file upload option instead."
    )
