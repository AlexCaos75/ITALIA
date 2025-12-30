// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// ✅ CONFIG FIREBASE
// ⚠️ NON inventare i valori: copiali da Firebase Console → Project settings → Web app
export const firebaseConfig = {
  apiKey: "INCOLLA_API_KEY",
  authDomain: "INCOLLA_AUTH_DOMAIN",
  databaseURL: "https://quiz-regioni-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "INCOLLA_PROJECT_ID",
  storageBucket: "INCOLLA_STORAGE_BUCKET",
  messagingSenderId: "INCOLLA_MESSAGING_SENDER_ID",
  appId: "INCOLLA_APP_ID"
};

// Init app
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// ✅ Autenticazione anonima (necessaria per multiplayer)
export function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        unsub();
        resolve(user);
      } else {
        signInAnonymously(auth).catch(reject);
      }
    });
  });
}
