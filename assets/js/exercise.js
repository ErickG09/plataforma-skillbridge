document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleId = urlParams.get("module");
    const activityId = urlParams.get("activity");
    const exerciseId = urlParams.get("exercise");

    if (!moduleId || !activityId || !exerciseId) {
        window.location.href = "platform.html";
        return;
    }

    loadQuestions(moduleId, activityId, exerciseId);
});

async function loadQuestions(moduleId, activityId, exerciseId) {
    const questionsContainer = document.getElementById("questions-container");
    const questionsRef = collection(db, `modules/${moduleId}/activities/${activityId}/ejercicios/${exerciseId}/preguntas`);
    const questionsSnapshot = await getDocs(questionsRef);

    questionsContainer.innerHTML = "";
    questionsSnapshot.forEach((questionDoc) => {
        const questionData = questionDoc.data();
        questionsContainer.innerHTML += `<p>${questionData.questionText}</p>`;
    });
}
