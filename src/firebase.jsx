import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_8YiPfXkZggJQOZGjxiPwMHSzWSH-pOQ",
  authDomain: "erp-saas-platform.firebaseapp.com",
  projectId: "erp-saas-platform",
  storageBucket: "erp-saas-platform.firebasestorage.app",
  messagingSenderId: "232433018921",
  appId: "1:232433018921:web:99de012385c65522af1438",
  measurementId: "G-QSLX22N53H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
