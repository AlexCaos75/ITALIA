// assets/js/mp.js
import { db, auth, ensureAnonAuth } from "./firebase-config.js";
import {
  doc, setDoc, getDoc, updateDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function makeRoomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function emitRoom(roomCode, data) {
  window.dispatchEvent(new CustomEvent("mp-room", {
    detail: { roomCode, data }
  }));
}

export const MP = {
  roomCode: null,
  isAdmin: false,
  unsubscribe: null,
};

export async function hostRoom(nickname, meta = {}) {
  if (!nickname) throw new Error("Nickname mancante.");

  await ensureAnonAuth();

  const roomCode = makeRoomCode(6);
  const roomRef = doc(db, "rooms", roomCode);

  await setDoc(roomRef, {
    roomCode,
    createdAt: serverTimestamp(),
    adminUid: auth.currentUser.uid,
    adminNickname: nickname,
    adminOnline: true,
    meta: meta || {},
  });

  // ascolto stato stanza
  bindRoom(roomCode, true);

  return roomCode;
}

export async function joinRoom(roomCode, nickname) {
  if (!roomCode) throw new Error("Room code mancante.");
  if (!nickname) throw new Error("Nickname mancante.");

  await ensureAnonAuth();

  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Stanza non trovata: " + roomCode);

  // ascolto stato stanza
  bindRoom(roomCode, false);

  return true;
}

function bindRoom(roomCode, isAdmin) {
  // chiudi eventuale listener precedente
  if (MP.unsubscribe) {
    try { MP.unsubscribe(); } catch {}
    MP.unsubscribe = null;
  }

  MP.roomCode = roomCode;
  MP.isAdmin = !!isAdmin;

  const roomRef = doc(db, "rooms", roomCode);
  MP.unsubscribe = onSnapshot(roomRef, async (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    // Se sei admin e la stanza ti appartiene, tieni adminOnline true
    if (MP.isAdmin && auth.currentUser?.uid === data.adminUid) {
      // (evita loop) aggiorna solo se falso
      if (data.adminOnline !== true) {
        try {
          await updateDoc(roomRef, { adminOnline: true });
        } catch {}
      }
    }

    emitRoom(roomCode, data);
  });
}
