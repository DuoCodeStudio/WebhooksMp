
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyB5_TUgeXjh_EvWID9W-CBEt2cXFQgJK5s",
  authDomain: "curso-celular-eb265.firebaseapp.com",
  projectId: "curso-celular-eb265",
  storageBucket: "curso-celular-eb265.firebasestorage.app",
  messagingSenderId: "1069355368230",
  appId: "1:1069355368230:web:6a3facb98d031009010be7",
  measurementId: "G-CR2634LGQF"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };