import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const MP = { roomId:null, uid:null, nickname:null, isAdmin:false, unsubRoom:null, unsubPlayers:null };

async function ensureAuth(){
  if (MP.uid) return MP.uid;
  const cred = await signInAnonymously(auth);
  MP.uid = cred.user.uid;
  return MP.uid;
}

function genRoomCode(len=6){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="";
  for(let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export async function hostRoom(nickname, initialState){
  await ensureAuth();
  const code = genRoomCode(6);
  const roomRef = doc(db,"rooms",code);
  await setDoc(roomRef,{
    adminUid: MP.uid,
    adminOnline: true,
    gameMode: initialState.gameMode ?? "quiz",
    quizTimeLimit: initialState.quizTimeLimit ?? 15,
    currentTurnIndex: 0,
    turnOrder: [],
    selectedPlayers: [],
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db,"rooms",code,"players",MP.uid),{
    nickname, score:0, wins:0, losses:0, games:0, joinedAt: serverTimestamp()
  });

  MP.roomId = code;
  MP.nickname = nickname;
  MP.isAdmin = true;
  attachListeners(code);
  return code;
}

export async function joinRoom(code, nickname){
  await ensureAuth();
  const snap = await getDoc(doc(db,"rooms",code));
  if(!snap.exists()) throw new Error("Room inesistente");
  await setDoc(doc(db,"rooms",code,"players",MP.uid),{
    nickname, score:0, wins:0, losses:0, games:0, joinedAt: serverTimestamp()
  }, { merge:true });

  MP.roomId = code;
  MP.nickname = nickname;
  MP.isAdmin = (snap.data().adminUid === MP.uid);
  attachListeners(code);
  return true;
}

export function attachListeners(code){
  if (MP.unsubRoom) MP.unsubRoom();
  if (MP.unsubPlayers) MP.unsubPlayers();

  MP.unsubRoom = onSnapshot(doc(db,"rooms",code),(s)=>{
    if(!s.exists()) return;
    window.dispatchEvent(new CustomEvent("mp-room",{ detail:{ roomCode:code, data:s.data() } }));
  });

  const playersQ = query(collection(db,"rooms",code,"players"), orderBy("score","desc"));
  MP.unsubPlayers = onSnapshot(playersQ,(qs)=>{
    const players=[];
    qs.forEach(d=>players.push({ uid:d.id, ...d.data() }));
    window.dispatchEvent(new CustomEvent("mp-players",{ detail:{ roomCode:code, players } }));
  });
}

export async function updateRoom(patch){
  if(!MP.roomId) throw new Error("Non sei in una room");
  await updateDoc(doc(db,"rooms",MP.roomId), patch);
}
