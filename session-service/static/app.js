let sessionId = null;
let selectedChoice = null;
let score = 0;

const startScreen = document.getElementById("start-screen");
const scenarioScreen = document.getElementById("scenario-screen");
const finishScreen = document.getElementById("finish-screen");

const startButton = document.getElementById("start-button");
const submitButton = document.getElementById("submit-button");
const nextButton = document.getElementById("next-button");
const restartButton = document.getElementById("restart-button");

const situation = document.getElementById("situation");
const options = document.getElementById("options");

const feedback = document.getElementById("feedback");
const feedbackStatus = document.getElementById("feedback-status");
const explanation = document.getElementById("explanation");
const points = document.getElementById("points");

const scoreElement = document.getElementById("score");
const stepNumber = document.getElementById("step-number");
const progressFill = document.getElementById("progress-fill");


startButton.addEventListener("click", startExercise);
submitButton.addEventListener("click", submitAnswer);
nextButton.addEventListener("click", loadStep);
restartButton.addEventListener("click", () => location.reload());


async function startExercise() {
    const response = await fetch(
        "/sessions",
        {
            method: "POST"
        }
    );

    const data = await response.json();

    sessionId = data.id;

    startScreen.classList.add("hidden");
    scenarioScreen.classList.remove("hidden");

    await loadStep();
}


async function loadStep() {
    selectedChoice = null;
    submitButton.disabled = true;
    feedback.classList.add("hidden");

    // Frontend тепер отримує крок тільки через session-service.
    const response = await fetch(
        `/sessions/${sessionId}/step`
    );

    const data = await response.json();

    if (data.completed) {
        finishExercise();
        return;
    }

    situation.textContent = data.situation;
    stepNumber.textContent = data.id;

    progressFill.style.width =
        `${(data.id / 3) * 100}%`;

    options.innerHTML = "";

    Object.entries(data.options).forEach(
        ([letter, text]) => {

            const option = document.createElement("div");

            option.className = "option";

            option.innerHTML = `
                <div class="option-letter">
                    ${letter}
                </div>

                <div class="option-text">
                    ${text}
                </div>
            `;

            option.addEventListener(
                "click",
                () => selectOption(option, letter)
            );

            options.appendChild(option);
        }
    );
}


function selectOption(element, choice) {
    document
        .querySelectorAll(".option")
        .forEach(option =>
            option.classList.remove("selected")
        );

    element.classList.add("selected");

    selectedChoice = choice;
    submitButton.disabled = false;
}


async function submitAnswer() {
    if (!selectedChoice) {
        return;
    }

    submitButton.disabled = true;

    const response = await fetch(
        `/sessions/${sessionId}/answer`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            // Передаємо тільки вибір, без номера кроку.
            body: JSON.stringify({
                choice: selectedChoice
            })
        }
    );

    const result = await response.json();

    score = result.score;
    scoreElement.textContent = score;

    feedback.classList.remove(
        "hidden",
        "correct",
        "incorrect"
    );

    if (result.correct) {
        feedback.classList.add("correct");
        feedbackStatus.textContent = "Good decision.";
    } else {
        feedback.classList.add("incorrect");
        feedbackStatus.textContent = "Not the best response.";
    }

    points.textContent =
        result.points > 0
            ? `+${result.points} pts`
            : "0 pts";

    explanation.textContent = result.explanation;

    document
        .querySelectorAll(".option")
        .forEach(option => {
            option.style.pointerEvents = "none";
        });

    if (result.completed) {
        nextButton.textContent = "View results →";
    } else {
        nextButton.textContent = "Continue →";
    }
}


function finishExercise() {
    scenarioScreen.classList.add("hidden");
    finishScreen.classList.remove("hidden");

    document.getElementById(
        "final-score"
    ).textContent = score;

    const message =
        document.getElementById("final-message");

    if (score === 30) {
        message.textContent =
            "Strong response. You identified and contained the incident correctly.";
    } else if (score >= 20) {
        message.textContent =
            "Good response overall, with some opportunities to improve incident handling.";
    } else {
        message.textContent =
            "The exercise identified opportunities to improve detection and incident response.";
    }
}