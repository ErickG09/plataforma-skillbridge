// 🔹 Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

// ✅ INICIAR SESIÓN CON MATRÍCULA Y CONTRASEÑA
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const matricula = document.getElementById("matricula").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!matricula || !password) {
            showErrorMessage("⚠️ Por favor, completa todos los campos.");
            return;
        }

        try {
            // Buscar usuario por matrícula en Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("matricula", "==", matricula));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showErrorMessage("❌ Matrícula no encontrada. Verifica tu matrícula.");
                return;
            }

            let userData;
            querySnapshot.forEach((doc) => {
                userData = doc.data();
            });

            // Intentar iniciar sesión con el correo y la contraseña
            await signInWithEmailAndPassword(auth, userData.email, password);

            // ✅ Inicio de sesión exitoso
            showSuccessMessage("✅ Inicio de sesión exitoso. Redirigiendo...");
            setTimeout(() => {
                window.location.href = "platform.html";
            }, 1500);
        } catch (error) {
            console.error("❌ Error al iniciar sesión:", error);

            if (error.code === "auth/wrong-password") {
                showErrorMessage("❌ Contraseña incorrecta. Intenta de nuevo.");
            } else if (error.code === "auth/user-not-found") {
                showErrorMessage("❌ Usuario no encontrado. Verifica tu matrícula.");
            } else {
                showErrorMessage("❌ Error al iniciar sesión. Intenta de nuevo.");
            }
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
