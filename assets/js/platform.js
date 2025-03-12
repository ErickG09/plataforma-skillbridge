// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// 🔹 Configuración Firebase
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

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.warn("⚠️ Usuario no autenticado. Redirigiendo al login...");
            window.location.href = "index.html";
            return;
        }

        currentUser = user;
        console.log("✅ Usuario autenticado:", user.uid);

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.error("❌ Usuario no encontrado.");
                return;
            }

            const userData = userSnap.data();

            document.getElementById("user-name").innerText = userData.name || "Student";
            document.getElementById("user-role").innerText = userData.role || "student";

            if (userData.role === "admin") {
                document.getElementById("admin-section").style.display = "block";
            }

            await loadModules(); // 🔹 Cargar módulos
            await updateProgress(userData); // 🔹 Actualizar progreso
        } catch (error) {
            console.error("❌ Error:", error);
        }
    });
});

//===========================================================================
// 🔹 Cargar módulos visibles desde Firestore
//===========================================================================
async function loadModules() {
    const modulesContainer = document.getElementById("modules-container");
    modulesContainer.innerHTML = `<p>📦 Loading modules...</p>`;
    
    try {
        const modulesRef = collection(db, "modules");
        const querySnapshot = await getDocs(modulesRef);

        let modulesHTML = "";
        let visibleModules = 0;

        querySnapshot.forEach((doc) => {
            const moduleData = doc.data();
            const moduleId = doc.id;

            if (moduleData.isVisible) { // 🔹 Solo módulos visibles
                visibleModules++;

                modulesHTML += `
                    <button class="module-button" onclick="redirectToActivities('${moduleId}')">
                        ${moduleId}
                    </button>
                `;
            }
        });

        if (visibleModules === 0) {
            modulesContainer.innerHTML = `<p>⚠️ There are no available modules.</p>`;
        } else {
            modulesContainer.innerHTML = modulesHTML;
        }

    } catch (error) {
        console.error("❌ Error loading modules:", error);
        modulesContainer.innerHTML = "<p>⚠️ Error loading modules.</p>";
    }
}

// 🔹 Redirigir a `activities.html` cuando se seleccione un módulo
window.redirectToActivities = function(moduleId) {
    window.location.href = `activities.html?module=${moduleId}`;
};

//===========================================================================
// 🔹 Actualizar progreso del usuario
//===========================================================================
async function updateProgress(userData) {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    let totalActivities = 0;
    let completedActivities = userData.completedActivities ? userData.completedActivities.length : 0;

    const modulesSnapshot = await getDocs(collection(db, "modules"));
    for (const moduleDoc of modulesSnapshot.docs) {
        const activitiesSnapshot = await getDocs(collection(moduleDoc.ref, "activities"));
        totalActivities += activitiesSnapshot.size;
    }

    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    progressBar.style.width = `${progress}%`;
    progressText.innerText = `${Math.round(progress)}% Completed`;
}
