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
    setDoc, 
    collection, 
    getDocs 
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
let selectedAnswers = {}; 
let correctAnswers = {}; 
let exercises = []; 
let currentUser = null;

/**
 * ===================================================
 * 🔹 Verificar autenticación antes de cargar la página
 * ===================================================
 */
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.warn("⚠️ No hay usuario autenticado. Redirigiendo a login...");
            window.location.href = "index.html";
            return;
        }
    
        currentUser = user;
        console.log(`✅ Usuario autenticado: ${user.uid}`);
    
        try {
            // 🔹 Obtener el nombre del usuario desde Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
    
            if (userSnap.exists()) {
                const userName = userSnap.data().name || "User";
                document.getElementById("user-name").innerText = `Hello, ${userName}`;
            }
    
            // 🔹 Obtener parámetros de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const moduleId = urlParams.get("module");
            const activityId = urlParams.get("activity");
    
            if (!moduleId || !activityId) {
                window.location.href = "platform.html";
                return;
            }
    
            console.log(`📥 Cargando ejercicios de: ${moduleId} > ${activityId}`);
            loadExercises(moduleId, activityId);
        } catch (error) {
            console.error("❌ Error al obtener los datos del usuario:", error);
        }
    });
});

/**
 * ===================================================
 * 🔹 FUNCIÓN: Cargar la lista de ejercicios desde Firebase
 * ===================================================
 */
async function loadExercises(moduleId, activityId) {
    const container = document.getElementById("question-container");
    container.innerHTML = "<p>Loading exercises...</p>";

    const exercisesRef = collection(db, "modules", moduleId, "activities", activityId, "exercises");
    const exercisesSnapshot = await getDocs(exercisesRef);

    if (exercisesSnapshot.empty) {
        container.innerHTML = "<p>⚠️ No exercises available for this activity.</p>";
        return;
    }

    exercises = exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    container.innerHTML = `<h1 class="exercise-title">Select an Exercise</h1><br>`; 

    exercises.forEach((exercise) => {
        const exerciseCard = document.createElement("div");
        exerciseCard.classList.add("exercise-card");
        exerciseCard.innerHTML = `
            <h3>${exercise.title}</h3>
            <p>${exercise.description}</p>
            <button onclick="startExercise('${moduleId}', '${activityId}', '${exercise.id}')">Start Exercise</button>
        `;
        container.appendChild(exerciseCard);
    });
}

/**
 * ===================================================
 * 🔹 FUNCIÓN: Mostrar un ejercicio específico
 * ===================================================
 */
window.startExercise = async function(moduleId, activityId, exerciseId) {
    const container = document.getElementById("question-container");
    container.innerHTML = "<p>Loading exercise...</p>";
    
    console.log(`🚀 Intentando cargar el ejercicio: ${exerciseId}`);

    try {
        // 📌 Obtener el ejercicio de Firebase
        const exerciseRef = doc(db, "modules", moduleId, "activities", activityId, "exercises", exerciseId);
        const exerciseSnap = await getDoc(exerciseRef);

        // 📌 Validar si el ejercicio existe
        if (!exerciseSnap.exists()) {
            console.error(`❌ Error: El ejercicio ${exerciseId} no existe en Firebase.`);
            container.innerHTML = "<p>⚠️ Error: El ejercicio no existe en la base de datos.</p>";
            return;
        }

        // 📌 Obtener los datos del ejercicio
        let exerciseData = exerciseSnap.data();
        console.log(`📥 Datos cargados de ${exerciseId}:`, exerciseData);

        // 🔴 VERIFICACIÓN IMPORTANTE: ¿`questions` está en el objeto?
        if (!exerciseData.hasOwnProperty("questions")) {
            console.error(`❌ Error: El ejercicio ${exerciseId} no tiene 'questions' en Firebase.`);
            container.innerHTML = `<p>⚠️ Error: Este ejercicio no tiene preguntas. Revisa la base de datos.</p>`;
            return;
        }

        // 📌 Verificar que `questions` es un array válido
        const questions = exerciseData.questions;
        console.log(`📋 Preguntas encontradas (${questions.length}):`, questions);

        if (!Array.isArray(questions) || questions.length === 0) {
            console.error(`❌ Error: El ejercicio ${exerciseId} tiene 'questions', pero está vacío o mal formateado.`);
            container.innerHTML = `<p>⚠️ Error: Este ejercicio no tiene preguntas válidas. Revisa la base de datos.</p>`;
            return;
        }

        // 🔹 Obtener respuestas anteriores del usuario
        console.log("🔍 Buscando respuestas anteriores del usuario...");
        const userAnswersRef = doc(db, "users", currentUser.uid, "answers", exerciseId);
        const userAnswersSnap = await getDoc(userAnswersRef);
        let previousAnswers = userAnswersSnap.exists() ? userAnswersSnap.data().responses : {};
        console.log("✅ Respuestas previas cargadas:", previousAnswers);

        selectedAnswers = previousAnswers;
        correctAnswers = {};

        // 🔍 Validación para asegurar que cada pregunta tenga las propiedades correctas
        console.log("🔄 Construyendo las preguntas para mostrar...");
        const questionBlocks = questions.map((q, index) => {
            if (!q || !q.options || !Array.isArray(q.options)) {
                console.warn(`⚠️ Pregunta inválida en índice ${index}:`, q);
                return `<p class="error-message">⚠️ Error en la pregunta ${index + 1}. Datos inválidos.</p>`;
            }

            correctAnswers[index] = q.correctAnswer ?? "";

            // 🔹 Resaltar palabras subrayadas si existen
            const formattedQuestion = q.underlinedWords && Array.isArray(q.underlinedWords)
                ? q.underlinedWords.reduce((text, word) => 
                    text.replace(word, `<span class="highlighted-word">${word}</span>`), 
                    q.question)
                : q.question;

            return `
                <div class="question-block"> 
                    <p class="question-text">${formattedQuestion}</p>
                    <div class="options">
                        ${q.options.map(option => `
                            <button class="option-button ${previousAnswers[index] === option ? 'selected' : ''}" 
                                data-question="${index}" 
                                onclick="selectAnswer('${exerciseId}', ${index}, '${option}')">
                                ${option}
                            </button>
                        `).join("")}
                    </div>
                </div>
            `;
        }).join("");

        console.log("✅ Preguntas construidas correctamente.");

        container.innerHTML = `
            <button class="back-button" onclick="goBackToExercises('${moduleId}', '${activityId}')">⬅ Back to Exercises</button>
            <h2 class="exercise-title">${exerciseData.title}</h2>
            <p class="exercise-description">${exerciseData.description}</p>
            ${questionBlocks}
            <div class="score-container">
                <p id="score-display">Score: ${userAnswersSnap.exists() ? userAnswersSnap.data().score : "-"}</p>
                <button class="check-button" onclick="calculateScore('${exerciseId}')">Check Answers</button>
            </div>
        `;

    } catch (error) {
        console.error("❌ Error en startExercise:", error);
        container.innerHTML = "<p>⚠️ Error al cargar el ejercicio. Intenta nuevamente.</p>";
    }
};




/**
 * ===================================================
 * 🔹 FUNCIÓN: Seleccionar respuesta y guardarla en Firebase
 * ===================================================
 */
window.selectAnswer = async function(exerciseId, questionIndex, answer) {
    selectedAnswers[questionIndex] = answer;

    const userAnswersRef = doc(db, "users", currentUser.uid, "answers", exerciseId);
    await setDoc(userAnswersRef, { responses: selectedAnswers }, { merge: true });

    document.querySelectorAll(`.option-button[data-question="${questionIndex}"]`).forEach(btn => btn.classList.add("disabled"));
};

/**
 * ===================================================
 * 🔹 FUNCIÓN: Calcular Score y Guardarlo en Firebase
 * ===================================================
 */
window.calculateScore = async function(exerciseId) {
    let correct = Object.keys(selectedAnswers).filter(index => selectedAnswers[index] === correctAnswers[index]).length;
    let score = `${correct} / ${Object.keys(correctAnswers).length}`;
    document.getElementById("score-display").innerText = `Score: ${score}`;

    await setDoc(doc(db, "users", currentUser.uid, "answers", exerciseId), { score, responses: selectedAnswers }, { merge: true });
};

/**
 * ===================================================
 * 🔹 FUNCIÓN: Regresar a la lista de ejercicios
 * ===================================================
 */
window.goBackToExercises = function(moduleId, activityId) {
    loadExercises(moduleId, activityId);
};
