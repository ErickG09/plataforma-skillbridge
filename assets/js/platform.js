// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    getDocs, 
    updateDoc 
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

            // 🔹 Actualizar UI con el nombre del usuario
            document.getElementById("user-name").innerText = userData.name || "Student";
            document.getElementById("user-role").innerText = userData.role || "Student";

            // 🔹 Mostrar sección de admin si aplica
            if (userData.role === "admin") {
                document.getElementById("admin-section").style.display = "block";
            }

            // 🔹 Cargar los módulos desde Firestore
            await loadModules();
            await updateProgress(userData);
        } catch (error) {
            console.error("❌ Error al obtener los datos del usuario:", error);
        }
    });
});

/**
 * ===================================================
 * FUNCIÓN: Cargar los módulos dinámicamente
 * ===================================================
 */
async function loadModules() {
    const modulesMenu = document.getElementById("modules-menu");
    if (!modulesMenu) return;

    modulesMenu.innerHTML = "";

    try {
        const modulesRef = collection(db, "modules");
        const querySnapshot = await getDocs(modulesRef);

        if (querySnapshot.empty) {
            console.warn("⚠️ No hay módulos en la base de datos.");
            modulesMenu.innerHTML = "<p>No modules available</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const moduleData = doc.data();
            const moduleId = doc.id;

            console.log(`📥 Módulo encontrado: ${moduleId}`, moduleData);

            const moduleItem = document.createElement("a");
            moduleItem.href = `activities.html?module=${moduleId}`;
            moduleItem.classList.add("menu-item");
            moduleItem.innerHTML = `<i class="fas fa-folder"></i> ${moduleData.name}`;

            modulesMenu.appendChild(moduleItem);
        });
    } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
    }
}


/**
 * ===================================================
 * FUNCIÓN: Redirigir a la pantalla de actividades de un módulo
 * ===================================================
 */
function openModule(moduleId) {
    window.location.href = `activities.html?module=${moduleId}`;
}

/**
 * ===================================================
 * FUNCIÓN: Actualizar la barra de progreso del usuario
 * ===================================================
 */
async function updateProgress(userData) {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    if (!progressBar || !progressText) return;

    let totalActivities = 0;
    let completedActivities = userData.completedActivities ? userData.completedActivities.length : 0;

    try {
        const modulesRef = collection(db, "modules");
        const modulesSnapshot = await getDocs(modulesRef);

        for (const moduleDoc of modulesSnapshot.docs) {
            const activitiesRef = collection(db, "modules", moduleDoc.id, "activities");
            const activitiesSnapshot = await getDocs(activitiesRef);
            totalActivities += activitiesSnapshot.size;
        }

        console.log(`✅ Total de actividades: ${totalActivities}, Completadas: ${completedActivities}`);

        let progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

        progressBar.style.width = `${progressPercentage}%`;
        progressText.innerText = `${Math.round(progressPercentage)}% Completed`;

        console.log(`🎯 Progreso actualizado: ${progressPercentage}%`);
    } catch (error) {
        console.error("❌ Error al calcular progreso:", error);
    }
}


/**
 * ===================================================
 * FUNCIÓN: Marcar actividad como finalizada
 * ===================================================
 */
async function completeActivity(userId, activityId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    let userData = userSnap.data();
    let completedActivities = userData.completedActivities || [];

    // 🔹 Si la actividad ya está marcada como completada, no hacer nada
    if (completedActivities.includes(activityId)) {
        console.log(`⚠️ La actividad ${activityId} ya está completada.`);
        return;
    }

    completedActivities.push(activityId);

    await updateDoc(userRef, { completedActivities });

    console.log(`✅ Actividad ${activityId} marcada como completada`);
    await updateProgress(userData);
}


/**
 * ===================================================
 * FUNCIÓN: Agregar soporte para ejercicios finales
 * ===================================================
 */
async function checkFinalExercise(moduleId, activityId) {
    const activityRef = doc(db, "modules", moduleId, "activities", activityId);
    const activitySnap = await getDoc(activityRef);

    if (!activitySnap.exists()) return false;

    const activityData = activitySnap.data();

    return activityData.isFinalExercise || false;
}

/**
 * ===================================================
 * FUNCIÓN: Marcar una actividad como finalizada y manejar ejercicios finales
 * ===================================================
 */
async function handleActivityCompletion(userId, moduleId, activityId) {
    const isFinal = await checkFinalExercise(moduleId, activityId);

    if (isFinal) {
        console.log("🎉 Último ejercicio completado para esta actividad.");
    }

    await completeActivity(userId, activityId);
}
