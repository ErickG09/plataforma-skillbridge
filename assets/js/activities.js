// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// Usuario actual
let currentUser = null;

// 🔹 Obtener módulo desde la URL
const urlParams = new URLSearchParams(window.location.search);
const moduleId = urlParams.get("module");

// 🔹 Redirigir si no hay módulo en la URL
if (!moduleId) {
    console.error("❌ No se encontró el módulo en la URL. Redirigiendo...");
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
    console.log("✅ Usuario autenticado:", user.uid);

    try {
        // Obtener datos del usuario desde Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("❌ Usuario no encontrado en la base de datos.");
            return;
        }

        const userData = userSnap.data();
        const userName = userData.name || "Student"; // Si no tiene nombre, usar "Student"

        // 🔹 Mostrar el nombre del usuario en la interfaz con saludo
        document.getElementById("user-name").innerText = `Hello, ${userName}`;

        // 🔹 Cargar actividades del módulo solo después de obtener el usuario
        await loadActivities();
    } catch (error) {
        console.error("❌ Error al obtener los datos del usuario:", error);
    }
});


//===========================================================================
// 🔹 FUNCIÓN PARA CARGAR Y MOSTRAR ACTIVIDADES EN CARDS
//===========================================================================
async function loadActivities() {
    const activityGrid = document.getElementById("activity-grid");
    activityGrid.innerHTML = `<p class="loading-text">📦 Loading activities...</p>`;

    try {
        const activitiesRef = collection(db, `modules/${moduleId}/activities`);
        const querySnapshot = await getDocs(activitiesRef);

        if (querySnapshot.empty) {
            console.warn("⚠️ No hay actividades disponibles en este módulo.");
            activityGrid.innerHTML = "<p class='no-activities'>⚠️ No activities available in this module.</p>";
            return;
        }

        let activitiesHTML = "";

        querySnapshot.forEach((doc) => {
            const activity = doc.data();
            console.log("📌 Actividad cargada:", activity);

            if (!activity.isVisible) return; // 🔹 Solo mostrar actividades visibles

            activitiesHTML += `
                <div class="activity-card" onclick="redirectToActivity('${moduleId}', '${doc.id}')">
                    <div class="card-header">
                        <h3>${activity.activityName}</h3>
                    </div>
                    <div class="card-body">
                        <p>${activity.activityDesc}</p>
                        <button class="start-button">Start Activity</button>
                    </div>
                </div>
            `;
        });

        activityGrid.innerHTML = activitiesHTML;
    } catch (error) {
        console.error("❌ Error al obtener actividades:", error);
        activityGrid.innerHTML = "<p class='error-message'>⚠️ Error loading activities. Check the console.</p>";
    }
}

//===========================================================================
// 🔹 FUNCIÓN PARA REDIRIGIR A `activity.html` CON LA ACTIVIDAD SELECCIONADA
//===========================================================================
window.redirectToActivity = function (moduleId, activityId) {
    window.location.href = `activity.html?module=${moduleId}&activity=${activityId}`;
};
