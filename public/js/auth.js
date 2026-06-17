import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

document.getElementById("google-login-btn").addEventListener("click", async () => {
    const errorEl = document.getElementById("firebase-error");
    errorEl.style.display = "none";
    try {
        const provider = new GoogleAuthProvider();
        const result   = await signInWithPopup(auth, provider);
        const idToken  = await result.user.getIdToken();

        const response = await fetch("/account/firebase-login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ idToken }),
        });

        if (response.ok) {
            window.location.href = "/";
        } else {
            const data = await response.json();
            errorEl.textContent = data.error || "Sign-in failed. Please try again.";
            errorEl.style.display = "block";
        }
    } catch (err) {
        errorEl.textContent = err.message || "Sign-in failed. Please try again.";
        errorEl.style.display = "block";
    }
});
