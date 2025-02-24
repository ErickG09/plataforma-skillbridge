// 🔹 Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 🔹 Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCk8QjypvD96WR2Qj1k0lmeXM-DeSsaLSw",
    authDomain: "bd-skillbridge-platform.firebaseapp.com",
    projectId: "bd-skillbridge-platform",
    storageBucket: "bd-skillbridge-platform.firebasestorage.app",
    messagingSenderId: "965541638734",
    appId: "1:965541638734:web:47f9c5ef524a0940ad891f"
};

// 🔹 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase inicializado correctamente");

// 🔹 Elementos del DOM
const step1Form = document.getElementById("step1-form");
const registerContent = document.getElementById("register-content");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const nameField = document.getElementById("name");

let currentUser = null; // Para almacenar el usuario temporalmente

// ✅ PASO 1: REGISTRO DEL USUARIO EN FIREBASE AUTH
step1Form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailField.value.trim();
    const password = passwordField.value.trim();
    const name = nameField.value.trim();

    if (!email || !password || !name) {
        showError("⚠️ Por favor, completa todos los campos.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
        const userId = currentUser.uid;

        // Guardar nombre y correo en Firestore con matrícula vacía
        await setDoc(doc(db, "users", userId), {
            name: name,
            email: email,
            matricula: "", // Se asignará manualmente
            createdAt: serverTimestamp()
        });

        // 🔹 Mostrar mensaje de éxito y el formulario de matrícula
        showMatriculaForm();
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        showError("❌ Error en el registro. Inténtalo de nuevo.");
    }
});

// ✅ PASO 2: MOSTRAR FORMULARIO PARA INGRESAR MATRÍCULA
function showMatriculaForm() {
    registerContent.innerHTML = `
        <div class="success-message">
            <h2>¡Registro Completado!</h2>
            <p>Tu cuenta ha sido creada exitosamente. Ahora ingresa la matrícula que te proporcionó el profesor.</p>
        </div>

        <div class="form-group">
            <label for="matricula">ID / Matrícula</label>
            <input type="text" id="matricula" name="matricula" placeholder="Ingresa tu ID o matrícula" required>
        </div>

        <div id="error-message" class="error-message" style="display: none;"></div>

        <button id="register-button" class="finish-button">Confirmar Matrícula</button>
    `;

    document.getElementById("register-button").addEventListener("click", saveMatricula);
}

// ✅ PASO 3: VERIFICAR MATRÍCULA EN FIRESTORE SIN ELIMINAR EL FORMULARIO
async function saveMatricula() {
    const matriculaField = document.getElementById("matricula");
    const errorMessage = document.getElementById("error-message");
    const matricula = matriculaField.value.trim();

    if (!currentUser || !matricula) {
        showError("⚠️ Ingresa tu matrícula.");
        return;
    }

    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.matricula === "") {
                // ❌ Si la matrícula no ha sido asignada en Firestore, mostrar error
                showError("❌ Aún no se te ha asignado una matrícula. Contacta con el profesor.");
                return;
            }

            if (userData.matricula === matricula) {
                // ✅ Si la matrícula coincide, permitir el acceso
                showSuccess("✅ Matrícula verificada. Redirigiendo...");

                setTimeout(() => {
                    window.location.href = "platform.html";
                }, 1500);
            } else {
                // ❌ Matrícula incorrecta (pero el campo sigue visible)
                showError("❌ Matrícula incorrecta. Verifica con el profesor.");
            }
        }
    } catch (error) {
        console.error("❌ Error al verificar la matrícula:", error);
        showError("❌ Error al verificar la matrícula. Inténtalo de nuevo.");
    }
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES DE ERROR
function showError(message) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.innerHTML = `<p>${message}</p>`;
    errorMessage.style.display = "block";
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJE DE ÉXITO
function showSuccess(message) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.innerHTML = `<p>${message}</p>`;
    errorMessage.style.display = "block";
    errorMessage.classList.remove("error-message");
    errorMessage.classList.add("success-message");
}
