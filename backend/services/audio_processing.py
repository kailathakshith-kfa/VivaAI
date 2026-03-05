import ffmpeg
import os
import tempfile


def extract_audio(video_path: str) -> str:
    """
    Extracts audio from a video file and saves it as a WAV file.
    Returns the path to the extracted WAV file.
    """
    # Create a temp file for the audio
    temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_audio.close()
    audio_path = temp_audio.name

    try:
        (
            ffmpeg
            .input(video_path)
            .output(
                audio_path,
                ar=16000,      # 16kHz sample rate (required by Whisper)
                ac=1,          # Mono channel
                acodec="pcm_s16le",
                vn=None        # No video stream
            )
            .overwrite_output()
            .run(quiet=True)
        )
    except ffmpeg.Error as e:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        raise RuntimeError(f"FFmpeg audio extraction failed: {e.stderr.decode()}") from e

    return audio_path
