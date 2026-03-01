/*
* Wymagane jest włączenie logowania w firebase poprzez email / hasło
*
* W firebase rules należy podać zasadę zgodnie z plikiem zasady1.txt
* Firebase przy tworzeniu projektu poda ci całą formułę api FirebaseConfig
*
*
* */


// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
//W tym miejscu podajesz dane wygenerowane przez Firebase
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

export const DOCUMENTS_COLLECTION_NAME = 'uploaded_documents';

let firebaseApp = null;
let db = null;
let auth = null;

/**
 * Initialize Firebase app, auth, and firestore
 * @returns {Object} { auth, db }
 */
export function initFirebase() {
    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        db = getFirestore(firebaseApp);
    }
    return { auth, db };
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} { success, user?, error? }
 */
export async function loginWithEmail(email, password) {
    if (!auth) {
        initFirebase();
    }
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Register new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} { success, user?, error? }
 */
export async function registerWithEmail(email, password) {
    if (!auth) {
        initFirebase();
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Convert anonymous account to email/password account
 * @param {string} email - Email to link
 * @param {string} password - Password to set
 * @returns {Promise<Object>} { success, error? }
 */
export async function convertAnonymousToEmail(email, password) {
    const { auth: authInstance } = initFirebase();

    if (!authInstance || !authInstance.currentUser) {
        return { success: false, error: 'No user logged in' };
    }

    try {
        const { EmailAuthProvider, linkWithCredential } = await import('firebase/auth');
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(authInstance.currentUser, credential);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export { db, auth };