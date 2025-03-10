// 🔹 Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs 
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

// 🔹 Lista de módulos a cargar automáticamente
const moduleNames = ["Grammar", "Listening", "Reading", "Written"];

/**
 * ===================================================
 * 🔹 FUNCIÓN: Leer un archivo JSON desde la carpeta
 * ===================================================
 */
async function fetchJSON(filePath) {
    try {
        console.log(`📥 Intentando leer: ${filePath}`);
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`❌ No se encontró el archivo: ${filePath}`);
        return await response.json();
    } catch (error) {
        console.error(`⚠️ Error al leer ${filePath}: ${error.message}`);
        return null;
    }
}

/**
 * ===================================================
 * 🔹 FUNCIÓN: Verificar permisos de administrador
 * ===================================================
 */
async function checkAdminPermissions(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    return userData.role === "admin";
}

/**
 * ===================================================
 * 🔹 FUNCIÓN: Subir módulos, actividades y ejercicios a Firebase
 * ===================================================
 */
async function uploadAllModules(userId) {
    const isAdmin = await checkAdminPermissions(userId);
    if (!isAdmin) {
        console.warn("🚫 No tienes permisos para subir módulos.");
        return;
    }

    console.log("📤 Iniciando carga de módulos...");

    for (const moduleName of moduleNames) {
        console.log(`📤 Procesando módulo: ${moduleName}`);

        let moduleActivities = {};

        for (let i = 1; i <= 2; i++) {
            const activityFile = `json/${moduleName}/activity${i}.json`;
            console.log(`📤 Leyendo JSON: ${activityFile}`);
            const activityData = await fetchJSON(activityFile);

            if (activityData) {
                moduleActivities[`activity${i}`] = activityData;
            }
        }

        if (Object.keys(moduleActivities).length === 0) {
            console.warn(`⚠️ No se encontraron actividades para ${moduleName}, saltando...`);
            continue;
        }

        const moduleRef = doc(db, "modules", moduleName);
        const moduleSnap = await getDoc(moduleRef);

        if (!moduleSnap.exists()) {
            console.log(`📤 Creando módulo: ${moduleName}`);
            await setDoc(moduleRef, {
                name: moduleName,
                totalActivities: Object.keys(moduleActivities).length
            });
        }

        for (const [activityId, activityDetails] of Object.entries(moduleActivities)) {
            const activityRef = doc(db, "modules", moduleName, "activities", activityId);
            const activitySnap = await getDoc(activityRef);

            if (!activitySnap.exists()) {
                console.log(`📤 Creando actividad: ${activityId}`);
                await setDoc(activityRef, {
                    title: activityDetails.title,
                    description: activityDetails.description,
                    totalExercises: activityDetails.exercises.length
                });
            }

            // 🔹 Validar cada ejercicio antes de subirlo
            for (const exercise of activityDetails.exercises) {
                console.log(`📋 Verificando ejercicio: ${exercise.id}`, exercise);

                // ❌ Validar que el ejercicio tenga las claves requeridas
                if (!exercise.id || !exercise.title || !exercise.questions || !Array.isArray(exercise.questions)) {
                    console.error(`❌ Error: El ejercicio ${exercise.id} está mal formado. Revisa el JSON.`);
                    continue;
                }

                // 🔹 Validar que cada pregunta dentro del ejercicio sea válida
                let isValidExercise = true;
                for (const question of exercise.questions) {
                    if (!question.question || !Array.isArray(question.options) || question.options.length === 0) {
                        console.error(`❌ Error: Pregunta mal formada en ejercicio ${exercise.id}:`, question);
                        isValidExercise = false;
                        break;
                    }
                }

                if (!isValidExercise) {
                    console.warn(`⚠️ Saltando ejercicio ${exercise.id} debido a errores en preguntas.`);
                    continue;
                }

                const exerciseRef = doc(db, "modules", moduleName, "activities", activityId, "exercises", exercise.id);
                const exerciseSnap = await getDoc(exerciseRef);

                if (!exerciseSnap.exists()) {
                    console.log(`📤 Subiendo ejercicio: ${exercise.id}`);
                    await setDoc(exerciseRef, exercise);
                    console.log(`✅ Ejercicio ${exercise.id} subido con éxito.`);
                } else {
                    console.warn(`⚠️ Ejercicio ${exercise.id} ya existe en Firebase. Saltando.`);
                }
            }
        }
    }

    console.log("✅ Todos los módulos fueron subidos correctamente.");
}

// 🔹 Ejecutar la función cuando el usuario se autentique
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`✅ Usuario autenticado: ${user.uid}`);
        uploadAllModules(user.uid);
    } else {
        console.warn("⚠️ No hay usuario autenticado.");
    }
});
