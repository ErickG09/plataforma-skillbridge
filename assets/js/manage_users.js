// 🔹 Importar Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    setDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc 
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

// 🔹 Elementos del DOM
const adminVerificationModal = document.getElementById("admin-verification");
const adminForm = document.getElementById("admin-form");

// ✅ Verificación de acceso de Administrador
adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const matricula = document.getElementById("admin-matricula").value.trim();
    const password = document.getElementById("admin-password").value.trim();

    if (!matricula || !password) {
        showMessage("⚠️ Todos los campos son obligatorios.", "error");
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        
        let adminUser = null;
        querySnapshot.forEach((doc) => {
            if (doc.data().matricula === matricula && doc.data().role === "admin") {
                adminUser = doc.data();
                adminUser.id = doc.id;
            }
        });

        if (!adminUser) {
            showMessage("❌ Acceso denegado. No eres administrador.", "error");
            return;
        }

        await signInWithEmailAndPassword(auth, adminUser.email, password);

        // ✅ Ocultar el modal después de iniciar sesión
        adminVerificationModal.style.display = "none";

        showMessage("✅ Acceso concedido. Bienvenido, Administrador.", "success");

        // 🔹 Cargar la lista de usuarios
        loadUsers();
    } catch (error) {
        console.error("❌ Error en la autenticación:", error);
        showMessage("❌ Credenciales incorrectas.", "error");
    }
});

/**
 * ===================================================
 * ✅ Registrar un nuevo usuario
 * ===================================================
 */
document.getElementById("user-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const role = document.getElementById("role").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !matricula || !role || !password) {
        showMessage("⚠️ Todos los campos son obligatorios.", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        await setDoc(doc(db, "users", userId), {
            name, email, matricula, role,
            completedActivities: [], 
            unlockedModules: [1, 2, 3, 4], 
            createdAt: new Date(),
            scores: {}, 
            answers: {}
        });

        showMessage("✅ Usuario registrado con éxito.", "success");
        document.getElementById("user-form").reset();
        loadUsers();
    } catch (error) {
        console.error("❌ Error al registrar usuario:", error);
        showMessage("❌ No se pudo registrar el usuario.", "error");
    }
});

/**
 * ===================================================
 * ✅ Cargar la lista de usuarios registrados
 * ===================================================
 */
async function loadUsers() {
    const usersTable = document.getElementById("users-list");
    usersTable.innerHTML = "";

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            usersTable.innerHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.matricula}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="edit-button" onclick="editUser('${doc.id}')">✏️ Editar</button>
                        <button class="delete-button" onclick="deleteUser('${doc.id}')">🗑️ Eliminar</button>
                    </td>
                </tr>`;
        });
    } catch (error) {
        console.error("❌ Error al cargar usuarios:", error);
        showMessage("❌ No se pudieron cargar los usuarios.", "error");
    }
}

/**
 * ===================================================
 * ✅ Editar usuario
 * ===================================================
 */
// 🔹 Referencia al modal y formulario
const editUserModal = document.getElementById("edit-user-modal");
const editUserForm = document.getElementById("edit-user-form");

// ✅ Función para abrir el modal y cargar los datos del usuario
window.editUser = async function (userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            showMessage("❌ Error: Usuario no encontrado.", "error");
            return;
        }

        const userData = userSnap.data();

        // 🔹 Rellenar el formulario con los datos actuales
        document.getElementById("edit-user-id").value = userId;
        document.getElementById("edit-name").value = userData.name;
        document.getElementById("edit-email").value = userData.email;
        document.getElementById("edit-matricula").value = userData.matricula;
        document.getElementById("edit-role").value = userData.role;

        // 🔹 Mostrar el modal
        editUserModal.style.display = "block";
    } catch (error) {
        console.error("❌ Error al cargar datos del usuario:", error);
        showMessage("❌ No se pudo cargar la información del usuario.", "error");
    }
};

// ✅ Función para cerrar el modal sin guardar
document.querySelector(".close-button").addEventListener("click", () => {
    editUserModal.style.display = "none";
});

// ✅ Función para guardar los cambios en Firestore
editUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = document.getElementById("edit-user-id").value;
    const newName = document.getElementById("edit-name").value.trim();
    const newEmail = document.getElementById("edit-email").value.trim();
    const newMatricula = document.getElementById("edit-matricula").value.trim();
    const newRole = document.getElementById("edit-role").value.trim();

    if (!newName || !newEmail || !newMatricula || !newRole) {
        showMessage("⚠️ Todos los campos son obligatorios.", "error");
        return;
    }

    try {
        await updateDoc(doc(db, "users", userId), {
            name: newName,
            email: newEmail,
            matricula: newMatricula,
            role: newRole
        });

        showMessage("✅ Usuario actualizado correctamente.", "success");
        editUserModal.style.display = "none";
        loadUsers();
    } catch (error) {
        console.error("❌ Error al actualizar usuario:", error);
        showMessage("❌ No se pudo actualizar el usuario.", "error");
    }
});


/**
 * ===================================================
 * ✅ Eliminar usuario (Firestore)
 * ===================================================
 */
window.deleteUser = async function(userId) {
    const confirmation = confirm("¿Estás seguro de que deseas eliminar este usuario?");
    if (!confirmation) return;

    try {
        await deleteDoc(doc(db, "users", userId));
        showMessage("✅ Usuario eliminado correctamente de Firestore.", "success");
        loadUsers();
    } catch (error) {
        console.error("❌ Error al eliminar usuario:", error);
        showMessage("❌ No se pudo eliminar el usuario.", "error");
    }
};

/**
 * ===================================================
 * ✅ Mostrar mensajes en la UI
 * ===================================================
 */
function showMessage(message, type) {
    const messageBox = document.getElementById("message-box");
    messageBox.innerHTML = `<p>${message}</p>`;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 5000);
}

// 🔹 Cargar automáticamente los usuarios cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});
