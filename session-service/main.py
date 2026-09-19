import os
from pathlib import Path
from uuid import uuid4

import httpx

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymongo import MongoClient


app = FastAPI()


# URL scenario-service для локального запуску і Kubernetes.
SCENARIO_URL = os.environ.get(
    "SCENARIO_URL",
    "http://localhost:8001"
)


# Підключення до MongoDB.
MONGO_URL = os.environ.get(
    "MONGO_URL",
    "mongodb://localhost:27017"
)

mongo_client = MongoClient(MONGO_URL)

db = mongo_client["ir_tabletop"]
sessions = db["sessions"]


class AnswerRequest(BaseModel):
    choice: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/sessions")
def create_session():
    session_id = str(uuid4())

    session = {
        "_id": session_id,
        "score": 0,
        "current_step": 1,
        "completed": False,
        "answers": []
    }

    sessions.insert_one(session)

    return {
        "id": session_id
    }


@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    session = sessions.find_one(
        {"_id": session_id}
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return session


@app.get("/sessions/{session_id}/step")
async def get_current_step(session_id: str):
    session = sessions.find_one(
        {"_id": session_id}
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    if session["completed"]:
        return {
            "completed": True,
            "score": session["score"]
        }

    # Крок беремо із сесії, а не з браузера.
    step_id = session["current_step"]

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SCENARIO_URL}/steps/{step_id}"
        )

    if response.status_code == 404:
        session["completed"] = True

        sessions.replace_one(
            {"_id": session_id},
            session
        )

        return {
            "completed": True,
            "score": session["score"]
        }

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Scenario service unavailable"
        )

    return response.json()


@app.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: str,
    answer: AnswerRequest
):
    session = sessions.find_one(
        {"_id": session_id}
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    if session["completed"]:
        raise HTTPException(
            status_code=400,
            detail="Session already completed"
        )

    # Клієнт більше не визначає номер кроку.
    step_id = session["current_step"]

    async with httpx.AsyncClient() as client:
        check_response = await client.post(
            f"{SCENARIO_URL}/steps/{step_id}/check",
            json={"choice": answer.choice}
        )

        if check_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Scenario service error"
            )

        result = check_response.json()

        count_response = await client.get(
            f"{SCENARIO_URL}/steps"
        )

        if count_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Scenario service error"
            )

        total_steps = count_response.json()["count"]

    session["score"] += result["points"]

    session["answers"].append({
        "step": step_id,
        "choice": answer.choice,
        "correct": result["correct"],
        "points": result["points"]
    })

    # Після відповіді переходимо до наступного кроку.
    session["current_step"] += 1

    if session["current_step"] > total_steps:
        session["completed"] = True

    # Зберігаємо оновлену сесію в MongoDB.
    sessions.replace_one(
        {"_id": session_id},
        session
    )

    return {
        "correct": result["correct"],
        "points": result["points"],
        "explanation": result["explanation"],
        "score": session["score"],
        "completed": session["completed"]
    }


# Frontend віддає session-service.
STATIC_DIR = Path(__file__).parent / "static"

app.mount(
    "/",
    StaticFiles(
        directory=STATIC_DIR,
        html=True
    ),
    name="static"
)