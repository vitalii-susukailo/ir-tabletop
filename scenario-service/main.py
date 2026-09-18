from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from content import steps

app = FastAPI()


class Answer(BaseModel):
    choice: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/steps/{step_id}")
def get_step(step_id: int):
    for step in steps:
        if step["id"] == step_id:
            return {
                "id": step["id"],
                "situation": step["situation"],
                "options": step["options"]
            }

    raise HTTPException(status_code=404, detail="Step not found")


@app.post("/steps/{step_id}/check")
def check_answer(step_id: int, answer: Answer):
    for step in steps:
        if step["id"] == step_id:
            is_correct = answer.choice.upper() == step["correct_choice"]

            return {
                "correct": is_correct,
                "points": step["points"] if is_correct else 0,
                "explanation": step["explanation"]
            }

    raise HTTPException(status_code=404, detail="Step not found")