// assets/js/mp.js
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, query, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { db, auth, ensureAnonAuth } from "./firebase-config.js";

window.MP = {
  db, auth,
  roomId: null,
  uid: null,
  nickname: null,
  isAdmin: false,
  unsubRoom: null,
  unsubPlayers: null
};

function genRoomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function ensureUid() {
  if (window.MP.uid) return window.MP.uid;
  const uid = await ensureAnonAuth();
  window.MP.uid = uid;
  return uid;
}

function attachListeners(roomCode) {
  if (window.MP.unsubRoom) window.MP.unsubRoom();
  if (window.MP.unsubPlayers) window.MP.unsubPlayers();

  const roomRef = doc(db, "rooms", roomCode);

  window.MP.unsubRoom = onSnapshot(roomRef, (s) => {
    if (!s.exists()) return;
    window.dispatchEvent(new CustomEvent("mp-room", { detail: { roomCode, data: s.data() } }));
  });

  const playersRef = collection(db, "rooms", roomCode, "players");
  const qPlayers = query(playersRef, orderBy("score", "desc"));

  window.MP.unsubPlayers = onSnapshot(qPlayers, (qs) => {
    const players = [];
    qs.forEach((d) => players.push({ uid: d.id, ...d.data() }));
    window.dispatchEvent(new CustomEvent("mp-players", { detail: { roomCode, players } }));
  });
}

window.mpHostRoom = async function (nickname, initialState = {}) {
  await ensureUid();
  const roomCode = genRoomCode(6);

  const roomRef = doc(db, "rooms", roomCode);

  await setDoc(roomRef, {
    adminUid: window.MP.uid,
    adminOnline: true,
    gameMode: initialState.gameMode ?? "quiz",
    quizTimeLimit: initialState.quizTimeLimit ?? 15,
    currentTurnIndex: 0,
    turnOrder: [],
    selectedPlayers: [],
    completedRegions: [],
    createdAt: serverTimestamp()
  });

  const playerRef = doc(db, "rooms", roomCode, "players", window.MP.uid);
  await setDoc(playerRef, {
    nickname,
    score: 0, wins: 0, losses: 0, games: 0,
    joinedAt: serverTimestamp()
  });

  window.MP.roomId = roomCode;
  window.MP.nickname = nickname;
  window.MP.isAdmin = true;

  attachListeners(roomCode);
  return roomCode;
};

window.mpJoinRoom = async function (roomCode, nickname) {
  await ensureUid();
  const code = String(roomCode).trim().toUpperCase();

  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room inesistente");

  const playerRef = doc(db, "rooms", code, "players", window.MP.uid);
  await setDoc(playerRef, {
    nickname,
    score: 0, wins: 0, losses: 0, games: 0,
    joinedAt: serverTimestamp()
  }, { merge: true });

  window.MP.roomId = code;
  window.MP.nickname = nickname;
  window.MP.isAdmin = (snap.data().adminUid === window.MP.uid);

  attachListeners(code);
  return true;
};

window.mpUpdateRoom = async function (patch) {
  if (!window.MP.roomId) throw new Error("Non sei in una room");
  await updateDoc(doc(db, "rooms", window.MP.roomId), patch);
};

window.mpUpdateMyStats = async function (patch) {
  if (!window.MP.roomId) throw new Error("Non sei in una room");
  await updateDoc(doc(db, "rooms", window.MP.roomId, "players", window.MP.uid), patch);
};

window.mpIncrementMyScore = async function (delta) {
  await window.mpUpdateMyStats({ score: increment(delta) });
};

window.mpInc = increment;
