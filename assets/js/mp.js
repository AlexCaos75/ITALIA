// assets/js/mp.js
import { db, ensureAnonAuth } from "./firebase-config.js";
import {
  ref,
  set,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

export const MP = {
  roomCode: null,
  isAdmin: false
};

// genera codice stanza
function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function hostRoom(nickname, data = {}) {
  await ensureAnonAuth();

  const code = genCode();
  MP.roomCode = code;
  MP.isAdmin = true;

  const roomRef = ref(db, "rooms/" + code);
  await set(roomRef, {
    adminOnline: true,
    host: nickname,
    state: data
  });

  listenRoom(code);
  return code;
}

export async function joinRoom(code, nickname) {
  await ensureAnonAuth();

  MP.roomCode = code;
  MP.isAdmin = false;

  const roomRef = ref(db, "rooms/" + code);
  await update(roomRef, {
    lastJoin: nickname
  });

  listenRoom(code);
}

function listenRoom(code) {
  const roomRef = ref(db, "rooms/" + code);
  onValue(roomRef, snap => {
    if (!snap.exists()) return;

    window.dispatchEvent(new CustomEvent("mp-room", {
      detail: {
        roomCode: code,
        data: snap.val()
      }
    }));
  });
}
