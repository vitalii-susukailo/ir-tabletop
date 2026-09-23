let sessionId = null;
let selectedChoice = null;
let score = 0;

const totalSteps = 3;


// --------------------------------------------------
// Screens
// --------------------------------------------------

const startScreen =
    document.getElementById("start-screen");

const scenarioScreen =
    document.getElementById("scenario-screen");

const finishScreen =
    document.getElementById("finish-screen");


// --------------------------------------------------
// Scenario elements
// --------------------------------------------------

const stepNumber =
    document.getElementById("step-number");

const situation =
    document.getElementById("situation");

const options =
    document.getElementById("options");

const progressFill =
    document.getElementById("progress-fill");

const scoreElement =
    document.getElementById("score");


// --------------------------------------------------
// Decision / feedback views
// --------------------------------------------------

const decisionView =
    document.getElementById("decision-view");

const feedbackView =
    document.getElementById("feedback-view");

const feedbackStatus =
    document.getElementById("feedback-status");

const explanation =
    document.getElementById("explanation");

const points =
    document.getElementById("points");


// --------------------------------------------------
// Buttons
// --------------------------------------------------

const startButton =
    document.getElementById("start-button");

const submitButton =
    document.getElementById("submit-button");

const nextButton =
    document.getElementById("next-button");

const restartButton =
    document.getElementById("restart-button");


// --------------------------------------------------
// Events
// --------------------------------------------------

startButton.addEventListener(
    "click",
    startExercise
);

submitButton.addEventListener(
    "click",
    submitAnswer
);

nextButton.addEventListener(
    "click",
    loadStep
);

restartButton.addEventListener(
    "click",
    () => location.reload()
);


// --------------------------------------------------
// Start exercise
// --------------------------------------------------

async function startExercise() {

    const response = await fetch(
        "/sessions",
        {
            method: "POST"
        }
    );


    if (!response.ok) {
        alert("Could not create a new session.");
        return;
    }


    const data =
        await response.json();


    sessionId = data.id;

    score = 0;

    scoreElement.textContent = "0";


    startScreen.classList.add(
        "hidden"
    );

    finishScreen.classList.add(
        "hidden"
    );

    scenarioScreen.classList.remove(
        "hidden"
    );


    await loadStep();
}


// --------------------------------------------------
// Load current step
// --------------------------------------------------

async function loadStep() {

    selectedChoice = null;

    submitButton.disabled = true;


    // Switch back from feedback to decision view.

    feedbackView.classList.add(
        "hidden"
    );

    decisionView.classList.remove(
        "hidden"
    );


    const response = await fetch(
        `/sessions/${sessionId}/step`
    );


    if (!response.ok) {
        alert("Could not load the current step.");
        return;
    }


    const data =
        await response.json();


    // Session is finished.

    if (data.completed) {
        finishExercise();
        return;
    }


    stepNumber.textContent =
        data.id;


    situation.textContent =
        data.situation;


    progressFill.style.width =
        `${(data.id / totalSteps) * 100}%`;


    options.innerHTML = "";


    Object.entries(
        data.options
    ).forEach(
        ([letter, text]) => {

            const option =
                document.createElement("button");


            option.type = "button";

            option.className = "option";


            option.innerHTML = `
                <span class="option-letter">
                    ${letter}
                </span>

                <span class="option-text">
                    ${text}
                </span>
            `;


            option.addEventListener(
                "click",
                () => selectOption(
                    option,
                    letter
                )
            );


            options.appendChild(
                option
            );
        }
    );
}


// --------------------------------------------------
// Select answer
// --------------------------------------------------

function selectOption(
    element,
    choice
) {

    document
        .querySelectorAll(".option")
        .forEach(
            option => {
                option.classList.remove(
                    "selected"
                );
            }
        );


    element.classList.add(
        "selected"
    );


    selectedChoice = choice;

    submitButton.disabled = false;
}


// --------------------------------------------------
// Submit answer
// --------------------------------------------------

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
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                choice: selectedChoice
            })
        }
    );


    if (!response.ok) {

        submitButton.disabled = false;

        alert("Could not submit the decision.");

        return;
    }


    const result =
        await response.json();


    score = result.score;

    scoreElement.textContent =
        score;


    // Hide choices and replace them with feedback.

    decisionView.classList.add(
        "hidden"
    );

    feedbackView.classList.remove(
        "hidden"
    );


    if (result.correct) {

        feedbackStatus.textContent =
            "Your decision matches the recommended response.";

        feedbackStatus.className =
            "feedback-status correct-text";

    } else {

        feedbackStatus.textContent =
            "A different response would be recommended.";

        feedbackStatus.className =
            "feedback-status incorrect-text";
    }


    points.textContent =
        result.points > 0
            ? `+${result.points} pts`
            : "0 pts";


    explanation.textContent =
        result.explanation;


    if (result.completed) {

        nextButton.innerHTML =
            `View results <span>→</span>`;

    } else {

        nextButton.innerHTML =
            `Continue <span>→</span>`;
    }
}


// --------------------------------------------------
// Finish exercise
// --------------------------------------------------

function finishExercise() {

    scenarioScreen.classList.add(
        "hidden"
    );

    finishScreen.classList.remove(
        "hidden"
    );


    document.getElementById(
        "final-score"
    ).textContent = score;


    const message =
        document.getElementById(
            "final-message"
        );


    if (score === 30) {

        message.textContent =
            "Strong response. Your decisions aligned with the recommended approach throughout the incident.";

    } else if (score >= 20) {

        message.textContent =
            "Good response overall. Some decisions could be improved, but the incident was handled effectively.";

    } else {

        message.textContent =
            "The exercise identified opportunities to strengthen your incident response decisions.";
    }
}