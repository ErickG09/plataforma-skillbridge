// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// ✅ VERIFICAR AUTENTICACIÓN ANTES DE CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.warn("⚠️ No hay usuario autenticado. Redirigiendo a login...");
            window.location.href = "login.html";
            return;
        }

        console.log("✅ Usuario autenticado:", user.uid);

        try {
            // 🔹 Obtener información del usuario en Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.error("❌ Usuario no encontrado en Firestore");
                return;
            }

            const userData = userSnap.data();
            document.getElementById("user-name").innerText = `Hello, ${userData.name}`;

            // 🔹 Obtener módulo seleccionado de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const moduleId = urlParams.get("module");

            if (!moduleId) {
                console.warn("⚠️ No se encontró módulo en la URL. Redirigiendo...");
                window.location.href = "platform.html";
                return;
            }

            console.log(`📥 Cargando actividades del módulo: ${moduleId}`);
            loadActivities(moduleId);
        } catch (error) {
            console.error("❌ Error al obtener los datos del usuario:", error);
        }
    });
});

/**
 * ===================================================
 * FUNCIÓN: Cargar actividades del módulo seleccionado
 * ===================================================
 */
async function loadActivities(moduleId) {
    const activityGrid = document.getElementById("activity-grid");
    if (!activityGrid) return;

    activityGrid.innerHTML = "<p>Loading activities...</p>";

    try {
        // 🔹 Obtener actividades desde Firestore (como subcolección)
        const activitiesRef = collection(db, "modules", moduleId, "activities");
        const activitiesSnapshot = await getDocs(activitiesRef);

        if (activitiesSnapshot.empty) {
            console.warn("⚠️ No hay actividades para este módulo.");
            activityGrid.innerHTML = "<p>No activities available for this module.</p>";
            return;
        }

        activityGrid.innerHTML = ""; // Limpiar contenido antes de agregar las actividades

        activitiesSnapshot.forEach((activityDoc) => {
            const activityData = activityDoc.data();
            const activityId = activityDoc.id;

            console.log(`📥 Actividad encontrada: ${activityId}`, activityData);

            const activityCard = document.createElement("div");
            activityCard.classList.add("activity-card");
            activityCard.innerHTML = `
                <h3>${activityData.title || "Untitled Activity"}</h3>
                <p>${activityData.description || "No description available."}</p>
                <button onclick="openActivity('${moduleId}', '${activityId}')">Start Activity</button>
            `;

            activityGrid.appendChild(activityCard);
        });
    } catch (error) {
        console.error("❌ Error al cargar actividades:", error);
        activityGrid.innerHTML = "<p>Error loading activities. Please try again later.</p>";
    }
}

/**
 * ===================================================
 * FUNCIÓN: Abrir una actividad específica
 * ===================================================
 */
window.openActivity = function(moduleId, activityId) {
    window.location.href = `activity.html?module=${moduleId}&activity=${activityId}`;
};

/**
 * ===================================================
 * FUNCIÓN: Cargar los módulos de aprendizaje dinámicamente
 * ===================================================
 */
async function loadLearningModules() {
    const modulesMenu = document.getElementById("modules-menu");
    if (!modulesMenu) return;

    modulesMenu.innerHTML = ""; // Limpiar antes de insertar contenido

    try {
        const modulesRef = collection(db, "modules");
        const querySnapshot = await getDocs(modulesRef);

        if (querySnapshot.empty) {
            console.warn("⚠️ No hay módulos en la base de datos.");
            modulesMenu.innerHTML = "<p>No modules available</p>";
            return;
        }

        // 🔹 Crear el título de la sección
        const title = document.createElement("h3");
        title.classList.add("modules-title");
        title.innerText = "LEARNING MODULES";
        modulesMenu.appendChild(title);

        // 🔹 Línea de separación
        const separator = document.createElement("hr");
        separator.classList.add("modules-separator");
        modulesMenu.appendChild(separator);

        querySnapshot.forEach((doc) => {
            const moduleData = doc.data();
            const moduleId = doc.id;

            console.log(`📥 Módulo encontrado: ${moduleId}`, moduleData);

            // 🔹 Crear cada módulo como un enlace con icono de carpeta
            const moduleItem = document.createElement("a");
            moduleItem.href = `activities.html?module=${moduleId}`;
            moduleItem.classList.add("module-item");
            moduleItem.innerHTML = `<i class="fas fa-folder"></i> ${moduleData.name}`;

            modulesMenu.appendChild(moduleItem);
        });
    } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
    }
}