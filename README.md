# VivaAI – AI Video Explanation Evaluator

A full-stack web application that evaluates video explanations by transcribing speech and scoring it semantically against a reference answer.

---

## Project Structure

```
VivaAI/
├── backend/               # FastAPI Python backend
│   ├── main.py            # API entry point (endpoints)
│   ├── requirements.txt   # Python dependencies
│   └── services/
│       ├── audio_processing.py   # FFmpeg audio extraction
│       ├── ai_models.py          # Whisper, SentenceTransformer, Feedback
│       └── __init__.py
│
├── frontend/              # Next.js (App Router) frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Main wizard page
│   │   │   └── globals.css       # Design system
│   │   └── components/
│   │       ├── UploadZone.tsx    # Drag-and-drop video picker
│   │       ├── ProcessingScreen.tsx  # Animated step progress
│   │       ├── ScoreRing.tsx     # SVG score ring animation
│   │       └── ResultsDashboard.tsx  # Results cards
│   └── .env.local
│
└── start.ps1              # One-command startup script
```

---

## Prerequisites

- **Python 3.11+** — [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **FFmpeg** — Must be on your PATH. Download from [ffmpeg.org](https://ffmpeg.org/download.html) or run:
  ```powershell
  winget install Gyan.FFmpeg
  ```

---

## Quick Start

### Option A – One command (recommended)
```powershell
.\start.ps1
```
This opens two terminal windows — one for the backend, one for the frontend. On the **first run**, it will install all Python dependencies (may take several minutes as it downloads Whisper, PyTorch, and Sentence Transformers models).

### Option B – Manual

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend (new terminal):**
```powershell
cd frontend
npm run dev
```

---

## Usage

1. Open [http://localhost:3000](http://localhost:3000)
2. Upload a `.mp4`, `.mov`, or `.webm` video where you explain something
3. Enter the expected reference answer in the text box
4. Click **Evaluate Explanation**
5. Watch the animated processing steps
6. View your similarity score, transcript, and AI feedback

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/upload-video` | Upload video, get transcript |
| POST | `/evaluate-answer` | Score transcript vs. reference |

API docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Uvicorn |
| Transcription | OpenAI Whisper (`base` model) |
| Similarity | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Audio | FFmpeg via `ffmpeg-python` |

---

## Notes

- **First run is slow**: Whisper and SentenceTransformer models are downloaded once (~200–500 MB) and cached locally.
- **GPU support**: If you have a CUDA-capable GPU, the models will automatically use it.
- Models are pre-loaded on startup so API requests are fast thereafter.
