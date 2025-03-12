// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    getDocs, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔹 Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCk8QjypvD96WR2Qj1k0lmeXM-DeSsaLSw",
    authDomain: "bd-skillbridge-platform.firebaseapp.com",
    projectId: "bd-skillbridge-platform",
    storageBucket: "bd-skillbridge-platform.appspot.com",
    messagingSenderId: "965541638734",
    appId: "1:965541638734:web:47f9c5ef524a0940ad891f"
};

// 🔹 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 Variables de estado
let currentUser = null;
let currentExerciseIndex = 0;
let exercises = [];
let userAnswers = {}; 

// 🔹 Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const moduleId = urlParams.get("module");
const activityId = urlParams.get("activity");

// 🔹 Redirigir si no hay datos válidos en la URL
if (!moduleId || !activityId) {
    console.error("❌ No se encontró el módulo o la actividad en la URL. Redirigiendo...");
    window.location.href = "platform.html";
}

// 🔹 Verificar autenticación del usuario
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        console.warn("⚠️ Usuario no autenticado. Redirigiendo al login...");
        window.location.href = "index.html";
        return;
    }

    currentUser = user;
    console.log(`✅ Usuario autenticado: ${user.uid}`);

    try {
        // Obtener datos del usuario desde Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userName = userSnap.data().name || "Student";
            document.getElementById("user-name").innerText = `Hello, ${userName}`;
        } else {
            console.warn("⚠️ No se encontró el usuario en la base de datos.");
        }
    } catch (error) {
        console.error("❌ Error al obtener el nombre del usuario:", error);
    }

    await loadExercises();
});


//===========================================================================
// 🔹 FUNCIÓN PARA CARGAR LOS EJERCICIOS
//===========================================================================
window.loadExercises = async function () {
    const container = document.getElementById("question-container");
    container.innerHTML = "<p>📦 Loading exercises...</p>";

    try {
        const exercisesRef = collection(db, `modules/${moduleId}/activities/${activityId}/ejercicios`);
        const exercisesSnapshot = await getDocs(exercisesRef);

        if (exercisesSnapshot.empty) {
            container.innerHTML = "<p>⚠️ No exercises available for this activity.</p>";
            return;
        }

        exercises = exercisesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        let exercisesHTML = `<h2 class="exercise-title">Select an Exercise</h2>`;

        exercises.forEach((exercise, index) => {
            exercisesHTML += `
                <div class="exercise-card">
                    <h3>${exercise.exerciseName}</h3>
                    <p>${exercise.exerciseDesc}</p>
                    <button onclick="startExercise(${index})">Start Exercise</button>
                </div>
            `;
        });

        container.innerHTML = exercisesHTML;
    } catch (error) {
        console.error("❌ Error al obtener ejercicios:", error);
        container.innerHTML = "<p>⚠️ Error loading exercises.</p>";
    }
};


//===========================================================================
// 🔹 FUNCIÓN PARA CARGAR UN EJERCICIO
//===========================================================================
window.startExercise = async function (index) {
    currentExerciseIndex = index;
    const exercise = exercises[index];
    const container = document.getElementById("question-container");

    container.innerHTML = "<p>📦 Loading questions...</p>";

    try {
        // Verificar si el usuario ya completó el ejercicio
        const userExerciseRef = doc(db, "users", currentUser.uid, "completedActivities", `${activityId}_${exercise.id}`);
        const userExerciseSnap = await getDoc(userExerciseRef);
        let alreadyCompleted = false;
        let savedAnswers = {};

        if (userExerciseSnap.exists()) {
            alreadyCompleted = true;
            savedAnswers = userExerciseSnap.data().answers;
        }

        // Obtener preguntas del ejercicio
        const questionsRef = collection(db, `modules/${moduleId}/activities/${activityId}/ejercicios/${exercise.id}/preguntas`);
        const questionsSnapshot = await getDocs(questionsRef);

        if (questionsSnapshot.empty) {
            container.innerHTML = `<p>⚠️ No questions available.</p>`;
            return;
        }

        let questionsHTML = `
            <button class="back-button" onclick="loadExercises()">⬅ Back to Exercises</button>
            <h2 class="exercise-title">${exercise.exerciseName}</h2>
            <p class="exercise-description">${exercise.exerciseDesc}</p>
            <div class="questions-list">
        `;

        questionsSnapshot.forEach((questionDoc) => {
            const question = questionDoc.data();
            const questionId = questionDoc.id;
            const savedAnswer = savedAnswers[questionId] || "";

            questionsHTML += `
                <div class="question-block">
                    <p class="question-text">${question.questionText}</p>
                    ${question.questionBaseText ? `<p class="base-text">${question.questionBaseText}</p>` : ""}
                    <div class="options">
                        ${question.options && question.options.length
                            ? question.options.map(option => `
                                <button class="option-button ${savedAnswer === option ? "selected" : ""}" 
                                        onclick="selectAnswer('${questionId}', '${option}')" ${alreadyCompleted ? "disabled" : ""}>
                                    ${option}
                                </button>
                            `).join("")
                            : `<input type="text" class="answer-text" id="answer-${questionId}" value="${savedAnswer}" 
                                    placeholder="Your answer" oninput="saveTextAnswer('${questionId}')" ${alreadyCompleted ? "disabled" : ""}>`}
                    </div>
                </div>
            `;
        });

        questionsHTML += `
            </div>
            <button class="submit-button" onclick="submitAnswers()" ${alreadyCompleted ? "disabled" : ""}>Check Answers</button>
            ${currentExerciseIndex < exercises.length - 1 ? `<button class="next-button" onclick="startExercise(${index + 1})">Next Exercise</button>` : `<button class="finish-button" onclick="finishActivity()">Finish & Return</button>`}
            <div class="score-display" id="score-display">${alreadyCompleted ? `<h3>Your Score: ${userExerciseSnap.data().score}</h3>` : ""}</div>
        `;

        container.innerHTML = questionsHTML;
    } catch (error) {
        console.error("❌ Error al cargar el ejercicio:", error);
        container.innerHTML = "<p>⚠️ Error loading exercise.</p>";
    }
};



//===========================================================================
// 🔹 FUNCIÓN PARA SELECCIONAR RESPUESTA
//===========================================================================
// 🔹 FUNCIÓN PARA SELECCIONAR RESPUESTA Y APLICAR ESTILO
window.selectAnswer = function (questionId, answer) {
    userAnswers[questionId] = answer;
    document.querySelectorAll(`.option-button`).forEach(btn => {
        if (btn.getAttribute("onclick")?.includes(questionId)) {
            btn.classList.remove("selected");
        }
    });
    document.querySelectorAll(`.option-button`).forEach(btn => {
        if (btn.textContent === answer) {
            btn.classList.add("selected");
        }
    });
};


//===========================================================================
// 🔹 FUNCIÓN PARA ENVIAR RESPUESTAS Y CALCULAR SCORE
//===========================================================================
window.submitAnswers = async function () {
    let score = 0;
    const container = document.getElementById("score-display");
    const exercise = exercises[currentExerciseIndex];

    // Obtener preguntas y comparar respuestas
    const questionsRef = collection(db, `modules/${moduleId}/activities/${activityId}/ejercicios/${exercise.id}/preguntas`);
    const questionsSnapshot = await getDocs(questionsRef);

    questionsSnapshot.forEach((questionDoc) => {
        const questionData = questionDoc.data();
        const questionId = questionDoc.id;
        let userAnswer = userAnswers[questionId];

        if (userAnswer) {
            userAnswer = userAnswer.trim().toLowerCase();
            let correctAnswer = questionData.answer.trim().toLowerCase();

            if (userAnswer === correctAnswer) {
                score += 1;  // Sumar puntos solo si es correcta
            }
        }
    });

    // Mostrar Score en la pantalla
    container.innerHTML = `<h3>Your Score: ${score}</h3>`;

    // Guardar respuestas y puntaje en Firestore
    await setDoc(doc(db, "users", currentUser.uid, "completedActivities", `${activityId}_${exercise.id}`), {
        answers: userAnswers,
        score: score,
    });

    alert(`🚀 Answers submitted! Your score is: ${score}`);

    // Deshabilitar opciones después de enviar respuestas
    document.querySelectorAll(".option-button").forEach(btn => btn.setAttribute("disabled", "true"));
    document.querySelectorAll(".answer-text").forEach(input => input.setAttribute("disabled", "true"));
    document.querySelector(".submit-button").setAttribute("disabled", "true");
};





//===========================================================================
// 🔹 FUNCIÓN PARA TERMINAR LA ACTIVIDAD
//===========================================================================
window.finishActivity = function () {
    alert("🎉 You have completed the activity!");
    window.location.href = "platform.html";
};


window.saveTextAnswer = function (questionId) {
    const inputElement = document.getElementById(`answer-${questionId}`);
    if (inputElement) {
        userAnswers[questionId] = inputElement.value;
    }
};



// 🔹 FUNCIÓN PARA GUARDAR RESPUESTAS EN TIEMPO REAL
window.storeTextAnswer = function (questionId) {
    let inputField = document.getElementById(`answer-${questionId}`);
    if (inputField) {
        userAnswers[questionId] = inputField.value;
    }
};
