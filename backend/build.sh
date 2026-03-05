#!/usr/bin/env bash
# Render build script — installs system deps + Python packages

set -o errexit

# Install ffmpeg (required by Whisper for audio processing)
apt-get update && apt-get install -y ffmpeg

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
