# WonderComic

AI-powered personalized comic book stories for children using Google's Gemini API. 

## Quick Start

**Prerequisites:** Python 3.13+, [uv](https://docs.astral.sh/uv/), Node.js 18+

1. Get a [Gemini API key](https://aistudio.google.com/apikey) and create a `.env` file in the root:
   ```
   GEMINI_API_KEY=your_key_here
   ```

2. Start the backend:
   ```bash
   cd backend
   uv sync
   uv run uvicorn main:app --reload --port 8000
   ```

3. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:3000

## Quick Start (Docker Compose)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

1. Clone the repo and create your `.env` file:
   ```bash
   git clone https://github.com/your-username/gemiHack.git
   cd gemiHack
   cp .env.example .env
   ```

2. Edit `.env` and add your [Gemini API key](https://aistudio.google.com/apikey):
   ```
   GEMINI_API_KEY=your_key_here
   ```

3. Build and start all services:
   ```bash
   docker compose up --build
   ```

4. Open http://localhost:3000

This starts two containers:
- **backend** — FastAPI server on port 8000, with a persistent Docker volume for generated images
- **frontend** — Vite dev server on port 3000

### Docker Compose Commands

```bash
docker compose up --build     # Build and start (foreground)
docker compose up --build -d  # Build and start (background)
docker compose down           # Stop and remove containers
docker compose logs -f        # Follow logs from all services
docker compose logs backend   # Follow logs from backend only
```

Generated images are stored in the `backend_images` named volume and persist across container restarts. The SQLite database is stored inside the backend container's `/app` bind mount.

## How It Works

1. **Character Setup** — A wizard collects your child's name, appearance, personality archetype, dream, and art style preference
2. **Story Generation** — Gemini generates a personalized comic book script with 10-18 panels
3. **Image Generation** — Each panel gets a unique AI-generated illustration matching the character description
4. **Interactive Reader** — Browse the story in a skeuomorphic book viewer with page-turn navigation
5. **Magic Revision** — Edit any panel's image with natural language ("add a dragon in the background")
6. **Gallery** — All stories are saved locally and accessible from the library

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLite (aiosqlite)
- **AI**: Google Gemini API (gemini-3-flash for scripts, gemini-2.5-flash for images)
- **Storage**: Local filesystem (images served via FastAPI static files)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:8000`) | No |
| `FRONTEND_URL` | Frontend URL for CORS (default: `http://localhost:3000`) | No |

## Project Structure

```
backend/
├── main.py           # FastAPI app, routes, static file serving
├── gemini_service.py # Gemini API integration (scripts + images)
├── database.py       # SQLite connection and table creation
├── crud.py           # Database operations + local image storage
├── models.py         # Pydantic request/response models
└── config.py         # Environment configuration

frontend/
├── App.tsx           # Router and layout
├── components/       # KidWizard, ComicPanel, MainPage, GalleryPage
├── hooks/            # useStoryGenerator
├── services/         # backendApi.ts
└── types.ts          # TypeScript interfaces
```
