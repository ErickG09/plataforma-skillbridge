import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: window.API_KEY,
    authDomain: window.AUTH_DOMAIN,
    projectId: window.PROJECT_ID,
    storageBucket: window.STORAGE_BUCKET,
    messagingSenderId: window.MESSAGING_SENDER_ID,
    appId: window.APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
