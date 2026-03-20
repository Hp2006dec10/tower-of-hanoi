import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5r3--q4Y-R2yMmRtzEdK9Q3sfy7J7xFo",
  authDomain: "adavya-tower-of-hanoi.firebaseapp.com",
  projectId: "adavya-tower-of-hanoi",
  storageBucket: "adavya-tower-of-hanoi.firebasestorage.app",
  messagingSenderId: "363857810596",
  appId: "1:363857810596:web:b5fab7950938013ea90231",
  measurementId: "G-HB2REPJJMD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };