// Firebase App
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

// Firebase Firestore
import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyACYFUbwyn0s_J3a9MAKNUmpuThQqjNYfk",
    authDomain: "birthday-remainder-84d56.firebaseapp.com",
    projectId: "birthday-remainder-84d56",
    storageBucket: "birthday-remainder-84d56.firebasestorage.app",
    messagingSenderId: "416200193473",
    appId: "1:416200193473:web:95c0595885ba9f55dc2b40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };