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

// 🔥 CONFIG REALE (OK)
export const firebaseConfig = {
  apiKey: "AIzaSyC4wjxtURhqn1cfiaEDWXSLrj9-BgwoINs",
  authDomain: "quiz-regioni.firebaseapp.com",
  databaseURL: "https://quiz-regioni-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-regioni",
  storageBucket: "quiz-regioni.firebasestorage.app",
  messagingSenderId: "80504945646",
  appId: "1:80504945646:web:865dac2c7890c3a62b2cff"
};

// 🔧 Init Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// ✅ AUTH ANONIMA (usata da mp.js)
export function ensureAnonAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        signInAnonymously(auth).catch(reject);
      }
    });
  });
}
