import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilitar persistencia sin bloquear la carga
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
    console.warn('Persistence error:', err);
  }
});

export {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
};
