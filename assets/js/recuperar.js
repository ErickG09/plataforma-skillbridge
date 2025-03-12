// 🔹 Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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

// Elementos del DOM
const recoverForm = document.getElementById("recover-form");
const messageBox = document.getElementById("message-box"); 
const submitButton = document.querySelector(".recover-button");

recoverForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        showMessage("❌ Por favor, ingresa un correo válido.", "error");
        resetButton(); // 🔹 Restaura el botón inmediatamente
        return;
    }

    // 🔹 Deshabilitar el botón y cambiar su texto
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage("✅ Enlace de recuperación enviado. Revisa tu correo.", "success");
    } catch (error) {
        console.error("Error al enviar el correo:", error);

        switch (error.code) {
            case "auth/invalid-email":
                showMessage("⚠️ El formato del correo no es válido.", "error");
                break;
            case "auth/user-not-found":
                showMessage("⚠️ No se encontró un usuario con ese correo.", "error");
                break;
            case "auth/too-many-requests":
                showMessage("🚫 Demasiadas solicitudes. Inténtalo más tarde.", "error");
                break;
            default:
                showMessage("❌ Error al enviar el enlace. Inténtalo nuevamente.", "error");
                break;
        }
    }

    resetButton(); // 🔹 Restaura el botón inmediatamente después de procesar la solicitud
});

// ✅ Función para mostrar mensajes en pantalla
function showMessage(message, type) {
    messageBox.innerHTML = `<p>${message}</p>`;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 5000);
}

// ✅ Función para restaurar el botón a su estado original
function resetButton() {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar Enlace";
}
