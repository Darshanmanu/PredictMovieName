# PredictMovieName

PredictMovieName is a full‑stack demo application for guessing a movie based on a plot description.
It exposes a simple API endpoint backed by [FastAPI](https://fastapi.tiangolo.com/) and a modern
React web interface built with [Vite](https://vitejs.dev/).  Users can paste a plot into
the search field and receive the most likely movie title, its release year, a rationale and a
confidence score.  The backend uses the OpenAI API to interpret the plot and assemble
a structured response, while the frontend presents results with a polished, glassmorphic UI.

## Repository structure

```
PredictMovieName/
├── README.md            # This file
├── .env.example         # Example environment file; copy to `.env` and set your API key
├── backend/             # Python FastAPI application
│   ├── app.py           # FastAPI server exposing the `/api/identify` endpoint
│   └── requirements.txt # Python dependencies for the backend
└── frontend/            # Vite/React client
    ├── index.html       # HTML entrypoint
    ├── package.json     # Node dependencies and scripts
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx      # Main React component
        ├── index.css    # Tailwind imports
        └── main.jsx     # React entrypoint
```

## Prerequisites

* **Node.js** (>=18) and **npm** to run the frontend.
* **Python 3.10+** and **pip** to run the backend.
* A valid OpenAI API key.  Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to your key.

## Installation

### Backend

1. Navigate into the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended) and install dependencies:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Copy the environment file and set your OpenAI key:

   ```bash
   cp ../.env.example ../.env
   # Edit ../.env and replace the placeholder with your actual API key
   ```

4. Start the backend server:

   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000/api/identify`.

### Frontend

1. From the repository root or the `frontend` directory, install Node dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   Vite will start the app at a local URL (usually `http://localhost:5173`).  The app
   assumes the backend is reachable at `http://localhost:8000`; adjust the fetch URL
   in `src/App.jsx` if you run the API on a different port or host.

3. Build for production (optional):

   ```bash
   npm run build
   ```

## How it works

### Backend

The backend exposes a single POST endpoint: `/api/identify`.  It accepts JSON like

```json
{
  "User_query": "A scientist travels through wormholes to find a new habitable planet for humanity."
}
```

Internally it forwards the plot to the OpenAI API using the GPT‑4o model with
instructions to deduce the movie, the release date, a justification and a confidence score.
It returns a JSON object containing `movie_name`, `release_date`, `rationale`, and
`confidence`.  Confidence is a float between 0 and 1 representing how certain the model
is about its choice.

### Frontend

The web app leverages React, Tailwind CSS, Framer Motion, Recharts and Lucide icons to create
a responsive, animated interface.  Users can submit a plot, view a radial gauge showing
confidence, see a styled description with the movie title and release year, and copy the
raw JSON response.  There’s also a dark/light toggle for accessibility and a minimal
heuristic fallback if the backend is unreachable.

The UI design takes inspiration from glassmorphism and aurora gradients, using
Framer Motion for subtle animations and Recharts for the confidence gauge.

## Updating the OpenAI API key

The application reads the OpenAI API key from the `.env` file in the repository root.
For security reasons the example file contains a dummy value.  After copying `.env.example`
to `.env`, edit `.env` and set `OPENAI_API_KEY` to your actual key.

## Notes

* The backend currently relies solely on the OpenAI LLM to identify movies.  To improve
  accuracy you might integrate a custom search engine (e.g. Google Custom Search API) or
  knowledge base.  This repository sets up the scaffolding for such enhancements.
* The frontend fetches results from `/api/identify` on the same domain.  When deploying
  the backend and frontend separately, configure CORS accordingly in `backend/app.py`.
