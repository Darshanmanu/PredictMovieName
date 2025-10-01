"""
Backend API for the PredictMovieName application.

This FastAPI server exposes a single endpoint `/api/identify` which accepts a plot description
and returns a guessed movie name, its release date, a rationale, and a confidence score.  The
implementation delegates reasoning to the OpenAI API and performs minimal post‑processing on the
response.  The OpenAI API key is read from an environment variable (`OPENAI_API_KEY`) which
should be defined in a `.env` file in the project root.
"""

import json
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import openai

# Load environment variables from .env if present
load_dotenv()

# Fetch the OpenAI API key
OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError(
        "OPENAI_API_KEY is not set. Please create a .env file based on .env.example and provide your API key."
    )

openai.api_key = OPENAI_API_KEY

# Initialise FastAPI app
app = FastAPI(title="PredictMovieName API", version="0.1.0")

# Configure CORS for local development; adjust origins for production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class IdentifyRequest(BaseModel):
    """
    Schema for the incoming request.  The `User_query` field contains the plot description.
    """
    User_query: str = Field(..., description="Natural language description of a movie plot.")


class IdentifyResponse(BaseModel):
    """
    Schema for the API response.  Each field is required.
    """
    movie_name: str
    release_date: str
    rationale: str
    confidence: float


def build_llm_prompt(plot: str) -> str:
    """
    Construct a detailed prompt for the language model.  The prompt instructs the LLM to
    imagine searching the internet and to produce a structured JSON response.  By clearly
    specifying the expected keys, we increase the chance that the model returns valid JSON.

    Parameters
    ----------
    plot: str
        The user‑provided plot description.

    Returns
    -------
    str
        The full prompt to send to the OpenAI API.
    """
    return (
        "You are a world‑class movie identification assistant. Given a plot description, you "
        "search the internet for clues (even though you rely on your own knowledge) and deduce "
        "the most likely movie. You must provide four fields: movie_name, release_date, "
        "rationale, and confidence. The rationale should explain why the selected movie fits "
        "the description, referencing key plot points, actors, or unique elements. Confidence "
        "should be a float between 0 and 1 representing your certainty.\n\n"
        f"Plot: {plot}\n\n"
        "Respond with a JSON object using these exact keys: movie_name, release_date, rationale, "
        "confidence."
    )


@app.post("/api/identify", response_model=IdentifyResponse)
async def identify_movie(req: IdentifyRequest) -> IdentifyResponse:
    """
    Identify the movie from a plot description.

    The function sends a carefully crafted prompt to the OpenAI chat completion API.  It then
    parses the response as JSON and returns the structured data.  If parsing fails, the
    endpoint returns a 500 error.

    Parameters
    ----------
    req: IdentifyRequest
        The request body containing the plot under `User_query`.

    Returns
    -------
    IdentifyResponse
        The deduced movie information.
    """
    prompt = build_llm_prompt(req.User_query)
    try:
        completion = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=400,
            temperature=0.3,
            top_p=0.95,
        )
    except Exception as e:
        # Propagate OpenAI API errors back to the client with a generic message
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")

    # Extract the assistant's message
    content = completion.choices[0].message.content.strip()
    try:
        # The model returns a JSON string; attempt to parse it
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse response as JSON. Raw response was: " + content,
        ) from exc

    # Validate fields and cast to the pydantic response model
    try:
        response = IdentifyResponse(**result)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Response JSON missing required fields or invalid types: {exc}"
        ) from exc

    return response
