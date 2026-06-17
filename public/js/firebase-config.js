import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey:            "AIzaSyC9HfwR1-v7_JooMJTedFa9v7BZwaCxPls",
    authDomain:        "webforum569.firebaseapp.com",
    projectId:         "webforum569",
    storageBucket:     "webforum569.firebasestorage.app",
    messagingSenderId: "692549610713",
    appId:             "1:692549610713:web:627a0e4677a9c8955062c8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
