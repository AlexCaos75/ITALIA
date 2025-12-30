// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyC4wjxtURhqn1cfiaEDWXSLrj9-BgwoINs",
  authDomain: "quiz-regioni.firebaseapp.com",
  databaseURL: "https://quiz-regioni-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-regioni",
  storageBucket: "quiz-regioni.firebasestorage.app",
  messagingSenderId: "80504945646",
  appId: "1:80504945646:web:865dac2c7890c3a62b2cff"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
