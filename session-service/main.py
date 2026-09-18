from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4
import httpx
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sessions = {}


class AnswerRequest(BaseModel):
    step: int
    choice: str


@app.post("/sessions")
def create_session():
    session_id = str(uuid4())

    sessions[session_id] = {
        "id": session_id,
        "score": 0,
        "answers": []
    }

    return {
        "id": session_id
    }


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return sessions[session_id]


@app.post("/sessions/{session_id}/answer")
async def submit_answer(session_id: str, answer: AnswerRequest):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    url = f"http://localhost:8001/steps/{answer.step}/check"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            json={
                "choice": answer.choice
            }
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Scenario service error"
        )

    result = response.json()

    sessions[session_id]["score"] += result["points"]

    sessions[session_id]["answers"].append(
        {
            "step": answer.step,
            "choice": answer.choice,
            "correct": result["correct"],
            "points": result["points"]
        }
    )

    return result