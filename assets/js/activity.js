document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleId = urlParams.get("module"); // ID del módulo
    const activityId = urlParams.get("activity"); // ID de la actividad

    if (!moduleId || !activityId) {
        document.getElementById("activity-title").innerText = "Error: Activity not found.";
        return;
    }

    fetch(`json/module${moduleId}.json`)
        .then(response => response.json())
        .then(data => {
            let activity = data.activities.find(act => act.id === activityId);
            if (!activity) {
                document.getElementById("activity-title").innerText = "Activity not found.";
                return;
            }

            document.getElementById("activity-title").innerText = activity.title;
            document.getElementById("activity-description").innerText = activity.description;

            let questionContainer = document.getElementById("question-container");
            let currentQuestionIndex = 0;

            function showQuestion(index) {
                let questionData = activity.questions[index];
                questionContainer.innerHTML = `
                    <h3>${questionData.question}</h3>
                    ${questionData.options.map(option => `
                        <button class="option-button">${option}</button>
                    `).join('')}
                `;

                document.querySelectorAll(".option-button").forEach(button => {
                    button.addEventListener("click", () => {
                        if (button.innerText === questionData.answer) {
                            button.style.backgroundColor = "green";
                        } else {
                            button.style.backgroundColor = "red";
                        }
                    });
                });
            }

            showQuestion(currentQuestionIndex);

            document.getElementById("next-question").addEventListener("click", () => {
                if (currentQuestionIndex < activity.questions.length - 1) {
                    currentQuestionIndex++;
                    showQuestion(currentQuestionIndex);
                } else {
                    alert("You have completed the activity!");
                }
            });

            document.getElementById("finish-activity").addEventListener("click", () => {
                window.location.href = `platform.html`;
            });
        })
        .catch(error => console.error("Error loading activity:", error));
});
