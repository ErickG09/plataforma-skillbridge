//===========================================================================
// 🔹 IMPORTAR FIREBASE Y CONFIGURAR LA BASE DE DATOS
//===========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
    getFirestore, collection, doc, setDoc, updateDoc, getDocs, getDoc
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// 🔹 CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCk8QjypvD96WR2Qj1k0lmeXM-DeSsaLSw",
    authDomain: "bd-skillbridge-platform.firebaseapp.com",
    projectId: "bd-skillbridge-platform",
    storageBucket: "bd-skillbridge-platform.appspot.com",
    messagingSenderId: "965541638734",
    appId: "1:965541638734:web:47f9c5ef524a0940ad891f"
};

// 🔹 INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// 🔹 VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO ANTES DE PERMITIR ACCIONES
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ Usuario autenticado:", user.uid);
    } else {
        alert("⚠️ Debes iniciar sesión primero.");
        window.location.href = "../index.html";
    }
});

async function checkAdminRole() {
    if (!auth.currentUser) return false;

    try {
        const userRef = doc(db, `users/${auth.currentUser.uid}`);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.role === "admin";  // 🔥 Verifica si el rol en Firestore es "admin"
        }
    } catch (error) {
        console.error("❌ Error al verificar el rol del usuario:", error);
    }
    return false;
}



//===========================================================================
// 🔹 GENERAR CAMPOS DINÁMICOS PARA EJERCICIOS
//===========================================================================
window.generateExerciseFields = function () {
    const count = document.getElementById('exercise-count').value;
    const container = document.getElementById('exercises-container');
    
    // 🔹 LIMPIA EL CONTENEDOR ANTES DE AGREGAR NUEVOS EJERCICIOS
    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
        <div class="exercise">
            <h4>Ejercicio ${i}</h4>
            <input type="text" placeholder="Nombre del ejercicio" class="exercise-name" required>
            <textarea placeholder="Descripción del ejercicio" class="exercise-desc" required></textarea>
            <label>Cantidad de preguntas:</label>
            <input type="number" class="question-count" min="1" required>
            <button type="button" onclick="generateQuestionFields(${i - 1})">Generar Preguntas</button>
            <div class="questions-container"></div>
        </div>`;
    }
};

//===========================================================================
// 🔹 GENERAR PREGUNTAS DENTRO DE UN EJERCICIO SELECCIONADO
//===========================================================================
window.generateQuestionFields = function (index) {
    const exercises = document.getElementsByClassName('exercise');
    const count = exercises[index].querySelector('.question-count').value;
    const questionsContainer = exercises[index].querySelector('.questions-container');
    
    // 🔹 LIMPIAR EL CONTENEDOR DE PREGUNTAS ANTES DE AGREGAR NUEVAS
    questionsContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        let questionId = `question-${index}-${i}`;
        questionsContainer.innerHTML += `
        <div class="question" id="${questionId}" style="border: 1px solid #ddd; padding: 10px; margin-top: 10px;">
            <h5>Pregunta ${i}</h5>
            <textarea placeholder="Texto de la pregunta" class="question-text" required></textarea>
            
            <label>Tipo de pregunta:</label>
            <select class="question-type" onchange="updateQuestionFields('${questionId}')">
                <option value="multiple-choice">Opción múltiple</option>
                <option value="fill-in">Completar texto</option>
                <option value="written">Escrita (campo abierto)</option>
                <option value="audio">Audio</option>
                <option value="reading">Reading (Texto largo)</option>
            </select>
            
            <div class="question-dynamic-content"></div>
        </div>`;

        updateQuestionFields(questionId);
    }
};

//===========================================================================
// 🔹 ACTUALIZAR LOS CAMPOS DE PREGUNTAS SEGÚN EL TIPO SELECCIONADO
//===========================================================================
window.updateQuestionFields = function (questionId) {
    let question = document.getElementById(questionId);
    let type = question.querySelector('.question-type').value;
    let dynamicContent = question.querySelector('.question-dynamic-content');

    dynamicContent.innerHTML = ''; // 🔹 LIMPIAR CONTENIDO PREVIO

    if (type === "multiple-choice") {
        dynamicContent.innerHTML = `
            <div class="options-container">
                <label>Opciones:</label>
                <div class="options-list"></div>
                <button type="button" onclick="addOption('${questionId}')">Agregar opción</button>
                <label>Respuesta correcta:</label>
                <input type="text" class="question-answer" placeholder="Escribe la opción correcta">
            </div>`;
    
    } else if (type === "fill-in") {
        dynamicContent.innerHTML = `
            <label>Texto base (usa "______" donde debe completarse):</label>
            <textarea class="question-base-text" placeholder="Ejemplo: 'La capital de Francia es ______'"></textarea>
            
            <label>Palabras que estarán subrayadas (opcional, separadas por coma):</label>
            <input type="text" class="question-keywords" placeholder="Ejemplo: París, Francia">
            
            <label>Respuesta correcta:</label>
            <input type="text" class="question-answer" placeholder="Ejemplo: París">`;
    
    } else if (type === "written") {
        dynamicContent.innerHTML = `
            <label>Respuesta escrita esperada:</label>
            <textarea class="question-answer" placeholder="Ejemplo de respuesta esperada"></textarea>
            <label>Límite de palabras:</label>
            <input type="number" class="word-limit" min="10" max="500" placeholder="Máx palabras">`;

    } else if (type === "audio") {
        dynamicContent.innerHTML = `
            <label>URL de Audio:</label>
            <input type="url" class="question-audio" placeholder="URL del audio">
            <audio controls style="width:100%;">
                <source src="" type="audio/mpeg">
                Tu navegador no soporta la reproducción de audio.
            </audio>`;

    } else if (type === "reading") {
        dynamicContent.innerHTML = `
            <label>Texto de lectura:</label>
            <textarea class="reading-text" placeholder="Inserta aquí el texto que los estudiantes leerán"></textarea>
            
            <div class="reading-questions-container"></div>
            <button type="button" onclick="addReadingQuestion('${questionId}')">Agregar pregunta</button>`;
    }
};



//===========================================================================
// 🔹 AGREGAR OPCIONES A PREGUNTAS DE OPCIÓN MÚLTIPLE
//===========================================================================
window.addOption = function (questionId) {
    let question = document.getElementById(questionId);
    let optionsList = question.querySelector('.options-list');

    if (!optionsList) {
        console.error("❌ Error: No se encontró la lista de opciones en la pregunta.");
        return;
    }

    let optionDiv = document.createElement("div");
    optionDiv.className = "option-item";
    optionDiv.innerHTML = `
        <input type="text" class="option" placeholder="Escribe una opción" required>
        <button type="button" onclick="removeOption(this)">❌</button>`;
    
    optionsList.appendChild(optionDiv);
};

// 🔹 ELIMINAR OPCIONES DE UNA PREGUNTA DE OPCIÓN MÚLTIPLE
window.removeOption = function (button) {
    button.parentElement.remove();
};


//===========================================================================
// 🔹 Registrar Actividades en Firestore
//===========================================================================
document.getElementById('activity-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("❌ No autorizado, inicia sesión primero.");
        return;
    }

    // 🔹 Verificar si el usuario tiene permisos de admin antes de continuar
    const isAdmin = await checkAdminRole();
    if (!isAdmin) {
        alert("❌ No tienes permisos para registrar actividades.");
        return;
    }

    console.log("✅ Usuario con permisos de administrador.");

    // 🔹 Verificación de elementos en el formulario
    const moduleElement = document.getElementById('module-select');
    if (!moduleElement || !moduleElement.value.trim()) {
        alert("⚠️ Error: No se encontró el módulo seleccionado.");
        return;
    }
    const module = moduleElement.value.trim();

    const activityNameElement = document.getElementById('activity-name');
    if (!activityNameElement || !activityNameElement.value.trim()) {
        alert("⚠️ Error: No se encontró el nombre de la actividad.");
        return;
    }
    const activityName = activityNameElement.value.trim();

    const activityDescElement = document.getElementById('activity-desc');
    if (!activityDescElement || !activityDescElement.value.trim()) {
        alert("⚠️ Error: No se encontró la descripción de la actividad.");
        return;
    }
    const activityDesc = activityDescElement.value.trim();

    const isVisibleElement = document.getElementById('activity-visible');
    const isVisible = isVisibleElement ? isVisibleElement.checked : false;
    const activityId = activityName.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, "_");

    try {
        // 🔹 Verificar si el módulo existe antes de registrar la actividad
        const moduleRef = doc(db, `modules/${module}`);
        const moduleSnap = await getDoc(moduleRef);
        if (!moduleSnap.exists()) {
            console.warn(`⚠️ El módulo '${module}' no existe. Creándolo...`);
            await setDoc(moduleRef, { isVisible: true });
        }

        // 🔹 Registrar la actividad
        const activityRef = doc(db, `modules/${module}/activities/${activityId}`);
        await setDoc(activityRef, { activityName, activityDesc, isVisible }, { merge: true });

        console.log("✅ Actividad registrada correctamente en Firestore.");

        // 🔹 Registrar ejercicios dentro de la actividad
        const exercisesDOM = document.querySelectorAll('.exercise');
        let exerciseIndex = 1;

        for (const exerciseDOM of exercisesDOM) {
            const exerciseName = exerciseDOM.querySelector('.exercise-name').value.trim();
            const exerciseDesc = exerciseDOM.querySelector('.exercise-desc').value.trim();

            if (!exerciseName || !exerciseDesc) {
                console.warn(`⚠️ Se omitió un ejercicio por datos incompletos.`);
                continue;
            }

            const exerciseId = `ejercicio${exerciseIndex}`;
            const exerciseRef = doc(activityRef, 'ejercicios', exerciseId);

            await setDoc(exerciseRef, { exerciseName, exerciseDesc, isVisible }, { merge: true });

            // 🔹 Registrar preguntas dentro del ejercicio
            const questionsDOM = exerciseDOM.querySelectorAll('.question');
            let questionIndex = 1;

            for (const questionDOM of questionsDOM) {
                const questionText = questionDOM.querySelector('.question-text').value.trim();
                const questionType = questionDOM.querySelector('.question-type').value;
                const options = Array.from(questionDOM.querySelectorAll('.option')).map(opt => opt.value.trim());
                const answer = questionDOM.querySelector('.question-answer')?.value.trim() || "";
                const audioURL = questionDOM.querySelector('.question-audio')?.value.trim() || "";
            
                // 🔹 Nuevo: Guardar oración base y palabras subrayadas si es "fill-in"
                const questionBaseText = questionDOM.querySelector('.question-base-text')?.value.trim() || "";
                const questionKeywords = questionDOM.querySelector('.question-keywords')?.value.trim().split(",").map(word => word.trim()) || [];
            
                if (!questionText) {
                    console.warn(`⚠️ Pregunta ${questionIndex} en ${exerciseName} no tiene texto.`);
                    continue;
                }
            
                const questionId = `pregunta${questionIndex}`;
                const questionRef = doc(exerciseRef, 'preguntas', questionId);
            
                await setDoc(questionRef, {
                    questionText,
                    questionType,
                    options: questionType === "multiple-choice" ? options : [],
                    answer,
                    audioURL,
                    isVisible,
                    ...(questionType === "fill-in" ? { questionBaseText, questionKeywords } : {}) // 🔹 Solo guarda estos campos si es "fill-in"
                }, { merge: true });
            
                questionIndex++;
            }
            
            exerciseIndex++;
        }

        // 🔹 Mostrar mensaje de éxito
        showMessage("✅ Actividad registrada exitosamente.", "success");

        // 🔹 Limpiar formulario después de registrar
        document.getElementById('activity-form').reset();
        document.getElementById('exercises-container').innerHTML = '';

        // 🔹 Recargar la lista de actividades
        loadActivities();

    } catch (error) {
        console.error("❌ Error al registrar la actividad:", error);
        showMessage("❌ Error al registrar la actividad. Revisa la consola.", "error");
    }
});




//===========================================================================
// 🔹 MOSTRAR MENSAJES DE ÉXITO O ERROR EN LA PANTALLA
//===========================================================================
window.showMessage = function (message, type) {
    const messageBox = document.getElementById('message-box');
    if (!messageBox) {
        console.error("❌ Error: No se encontró el contenedor de mensajes.");
        return;
    }

    messageBox.textContent = message;
    messageBox.style.display = "block";
    messageBox.style.padding = "10px";
    messageBox.style.borderRadius = "5px";
    
    if (type === "success") {
        messageBox.style.backgroundColor = "green";
        messageBox.style.color = "white";
    } else if (type === "error") {
        messageBox.style.backgroundColor = "red";
        messageBox.style.color = "white";
    }

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 5000);
};


//===========================================================================
// 🔹 FUNCIÓN PARA CARGAR Y MOSTRAR TODA LA INFORMACIÓN DESDE FIREBASE
//===========================================================================
// 🔹 Cargar módulos y actividades desde Firestore
async function loadActivities() {
    const activityList = document.getElementById("activity-list");
    activityList.innerHTML = "<p>📦 Cargando actividades...</p>";

    try {
        // 🔹 Obtener la lista de módulos desde Firestore
        const modulesSnapshot = await getDocs(collection(db, "modules"));
        let htmlContent = "";
        let visibleModules = 0;

        if (modulesSnapshot.empty) {
            activityList.innerHTML = `<p>⚠️ There are no available modules.</p>`; 
            return;
        }

        for (const moduleDoc of modulesSnapshot.docs) {
            const moduleData = moduleDoc.data();
            const moduleName = moduleDoc.id;
            const isModuleVisible = moduleData.isVisible ?? true; // Si no existe, lo asumimos como `true`

            if (!isModuleVisible) continue; // 🔹 Solo muestra módulos visibles
            visibleModules++;

            htmlContent += `
                <h4>📁 <b>${moduleName}</b></h4>
                <label>
                    <input type="checkbox" id="toggle-${moduleName}" onchange="toggleModuleVisibility('${moduleName}', this.checked)" ${isModuleVisible ? "checked" : ""}>
                    <b>Hacer visible todo el módulo</b>
                </label>
            `;

            // 🔹 Obtener actividades dentro del módulo
            const activitiesRef = collection(db, `modules/${moduleName}/activities`);
            const activitiesSnapshot = await getDocs(activitiesRef);

            if (activitiesSnapshot.empty) {
                htmlContent += `<p>❌ No hay actividades registradas.</p>`;
                continue;
            }

            for (const activityDoc of activitiesSnapshot.docs) {
                const activity = activityDoc.data();
                const isChecked = activity.isVisible ? "checked" : "";

                htmlContent += `
                <div class="activity-item">
                    <h5>📌 ${activity.activityName}</h5>
                    <p>${activity.activityDesc}</p>
                    <label>
                        <input type="checkbox" id="toggle-activity-${activityDoc.id}" onchange="toggleActivityVisibility('${moduleName}', '${activityDoc.id}', this.checked)" ${isChecked}>
                        <b>Visible</b>
                    </label>
                </div>`;
            }
        }

        if (visibleModules === 0) {
            htmlContent = `<p>⚠️ There are no available modules.</p>`; 
        }

        activityList.innerHTML = htmlContent;
    } catch (error) {
        console.error("❌ Error al cargar actividades:", error);
        activityList.innerHTML = "<p>⚠️ Error al cargar actividades.</p>";
    }
}

// 🔹 Llamar a `loadActivities()` cuando el usuario esté autenticado
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ Usuario autenticado:", user.uid);
        loadActivities();
    } else {
        alert("⚠️ Debes iniciar sesión primero.");
        window.location.href = "../index.html";
    }
});




//===========================================================================
// 🔹 FUNCIÓN PARA CAMBIAR VISIBILIDAD DE UN MÓDULO COMPLETO (Y SU CONTENIDO)
//===========================================================================
window.toggleModuleVisibility = async function (module, newState) {
    try {
        const moduleRef = doc(db, `modules/${module}`);
        await setDoc(moduleRef, { isVisible: newState }, { merge: true });

        // 🔹 Obtener todas las actividades del módulo y cambiar su visibilidad
        const activitiesRef = collection(db, `modules/${module}/activities`);
        const activitiesSnapshot = await getDocs(activitiesRef);

        for (const activityDoc of activitiesSnapshot.docs) {
            await updateDoc(activityDoc.ref, { isVisible: newState });

            const exercisesRef = collection(activityDoc.ref, "ejercicios");
            const exercisesSnapshot = await getDocs(exercisesRef);

            for (const exerciseDoc of exercisesSnapshot.docs) {
                await updateDoc(exerciseDoc.ref, { isVisible: newState });

                const questionsRef = collection(exerciseDoc.ref, "preguntas");
                const questionsSnapshot = await getDocs(questionsRef);

                for (const questionDoc of questionsSnapshot.docs) {
                    await updateDoc(questionDoc.ref, { isVisible: newState });
                }
            }
        }

        // 🔹 🔥 REFRESCAR LA LISTA EN VEZ DE RECARGAR TODA LA PÁGINA
        setTimeout(loadActivities, 500);

        showMessage(`✅ Módulo "${module}" ha sido ${newState ? "VISIBLE" : "OCULTO"} correctamente.`, "success");

    } catch (error) {
        console.error("❌ Error al cambiar visibilidad del módulo:", error);
        showMessage("⚠️ Error al actualizar visibilidad del módulo.", "error");
    }
};


//===========================================================================
// 🔹 FUNCIÓN PARA CAMBIAR VISIBILIDAD DE UNA ACTIVIDAD Y SU CONTENIDO
//===========================================================================
window.toggleActivityVisibility = async function (module, activityId, newState) {
    try {
        const activityRef = doc(db, `modules/${module}/activities/${activityId}`);
        await updateDoc(activityRef, { isVisible: newState });

        // Obtener los ejercicios dentro de la actividad
        const exercisesRef = collection(db, `modules/${module}/activities/${activityId}/ejercicios`);
        const exercisesSnapshot = await getDocs(exercisesRef);

        exercisesSnapshot.forEach(async (exerciseDoc) => {
            await updateDoc(exerciseDoc.ref, { isVisible: newState });

            // Obtener las preguntas dentro del ejercicio
            const questionsRef = collection(db, `modules/${module}/activities/${activityId}/ejercicios/${exerciseDoc.id}/preguntas`);
            const questionsSnapshot = await getDocs(questionsRef);

            questionsSnapshot.forEach(async (questionDoc) => {
                await updateDoc(questionDoc.ref, { isVisible: newState });
            });
        });

        showMessage(`✅ Actividad "${activityId}" ha sido ${newState ? "VISIBLE" : "OCULTA"} junto con sus ejercicios y preguntas.`, "success");
        loadActivities(); // Recargar lista

    } catch (error) {
        console.error("❌ Error al cambiar visibilidad de la actividad:", error);
    }
};


//===========================================================================
// 🔹 FUNCIÓN PARA CAMBIAR VISIBILIDAD DE UN EJERCICIO Y SUS PREGUNTAS
//===========================================================================
window.toggleExerciseVisibility = async function (module, activityId, exerciseId, newState) {
    try {
        const exerciseRef = doc(db, `modules/${module}/activities/${activityId}/ejercicios/${exerciseId}`);
        await updateDoc(exerciseRef, { isVisible: newState });

        // Obtener las preguntas dentro del ejercicio
        const questionsRef = collection(db, `modules/${module}/activities/${activityId}/ejercicios/${exerciseId}/preguntas`);
        const questionsSnapshot = await getDocs(questionsRef);

        questionsSnapshot.forEach(async (questionDoc) => {
            await updateDoc(questionDoc.ref, { isVisible: newState });
        });

        showMessage(`✅ El ejercicio "${exerciseId}" ha sido ${newState ? "VISIBLE" : "OCULTO"} junto con sus preguntas.`, "success");
        loadActivities(); // Recargar lista

    } catch (error) {
        console.error("❌ Error al cambiar visibilidad del ejercicio:", error);
    }
};


//===========================================================================
// 🔹 FUNCIÓN PARA CAMBIAR VISIBILIDAD DE UNA PREGUNTA
//===========================================================================
window.toggleQuestionVisibility = async function (module, activityId, exerciseId, questionId, newState) {
    try {
        const questionRef = doc(db, `modules/${module}/activities/${activityId}/ejercicios/${exerciseId}/preguntas/${questionId}`);
        await updateDoc(questionRef, { isVisible: newState });

        showMessage(`✅ La pregunta "${questionId}" ha sido ${newState ? "VISIBLE" : "OCULTA"}.`, "success");
        loadActivities(); // Recargar lista

    } catch (error) {
        console.error("❌ Error al cambiar visibilidad de la pregunta:", error);
    }
};

auth.currentUser?.getIdTokenResult().then((idTokenResult) => {
    console.log("Custom Claims:", idTokenResult.claims);
}).catch((error) => {
    console.error("❌ Error al obtener los claims:", error);
});