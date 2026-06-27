import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAKsGk12SfAccfe35NXG7qZF_lA9kDOWR4",
    authDomain: "facturacion-bar.firebaseapp.com",
    projectId: "facturacion-bar",
    storageBucket: "facturacion-bar.firebasestorage.app",
    messagingSenderId: "227514671229",
    appId: "1:227514671229:web:6d7e1c61f33f5c01251114"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.log('Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.log('Browser not supported');
    }
});

export { db };
