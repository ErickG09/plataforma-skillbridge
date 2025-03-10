// 🔹 Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
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

console.log("✅ Firebase inicializado correctamente");

// 🔹 Elementos del DOM
const loginForm = document.getElementById("login-form");
const matriculaInput = document.getElementById("matricula");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("error-message");
const forgotPasswordButton = document.getElementById("forgot-password");

// ✅ INICIAR SESIÓN CON MATRÍCULA Y CONTRASEÑA
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const matricula = matriculaInput.value.trim();
        const password = passwordInput.value.trim();

        if (!matricula || !password) {
            showErrorMessage("⚠️ Por favor, completa todos los campos.");
            return;
        }

        try {
            console.log(`🔍 Buscando usuario con matrícula: ${matricula}`);

            // 🔹 Buscar usuario en Firestore por matrícula
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("matricula", "==", matricula));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showErrorMessage("❌ Matrícula no encontrada. Verifica con el administrador.");
                return;
            }

            let userData;
            let userId;
            querySnapshot.forEach((doc) => {
                userData = doc.data();
                userId = doc.id;
            });

            if (!userData.email) {
                showErrorMessage("❌ Error: No se encontró un email vinculado a esta matrícula.");
                return;
            }

            console.log(`📩 Usuario encontrado: ${userData.email}`);

            // 🔹 Intentar iniciar sesión con el email y la contraseña
            await signInWithEmailAndPassword(auth, userData.email, password);

            // ✅ Inicio de sesión exitoso
            console.log(`✅ Usuario autenticado: ${userData.email}`);
            showSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");

            // Guardar el nombre del usuario en localStorage para futuras páginas
            localStorage.setItem("username", userData.name);

            setTimeout(() => {
                window.location.href = "platform.html";
            }, 1500);
        } catch (error) {
            console.error("❌ Error al iniciar sesión:", error);

            if (error.code === "permission-denied") {
                showErrorMessage("🚫 No tienes permisos suficientes para iniciar sesión. Verifica con el administrador.");
            } else if (error.code === "auth/wrong-password") {
                showErrorMessage("❌ Contraseña incorrecta. Intenta de nuevo.");
            } else if (error.code === "auth/user-not-found") {
                showErrorMessage("❌ Usuario no encontrado. Verifica tu matrícula.");
            } else {
                showErrorMessage("❌ Error al iniciar sesión. Inténtalo de nuevo.");
            }
        }
    });

    // ✅ Limpiar mensaje de error cuando el usuario empieza a escribir
    matriculaInput.addEventListener("input", clearErrorMessage);
    passwordInput.addEventListener("input", clearErrorMessage);
}

// ✅ FUNCIÓN PARA RESTABLECER CONTRASEÑA
if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async () => {
        const email = prompt("✉️ Ingresa tu correo electrónico para restablecer la contraseña:");
        if (!email) return;

        try {
            await sendPasswordResetEmail(auth, email);
            showSuccessMessage("✅ Correo de recuperación enviado. Revisa tu bandeja de entrada.");
        } catch (error) {
            console.error("❌ Error al enviar el correo de recuperación:", error);
            showErrorMessage("❌ No se pudo enviar el correo de recuperación. Verifica tu email.");
        }
    });
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJES DE ERROR
function showErrorMessage(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
    errorMessage.classList.add("error-message");
    errorMessage.style.display = "block";
}

// ✅ FUNCIÓN PARA MOSTRAR MENSAJE DE ÉXITO
function showSuccessMessage(message) {
    errorMessage.innerHTML = `<p>${message}</p>`;
    errorMessage.classList.remove("error-message");
    errorMessage.classList.add("success-message");
    errorMessage.style.display = "block";
}

// ✅ FUNCIÓN PARA LIMPIAR MENSAJES DE ERROR CUANDO EL USUARIO EDITA LOS CAMPOS
function clearErrorMessage() {
    errorMessage.style.display = "none";
}
