import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    addDoc,
    setDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    getDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';

/**
 * Custom hook for Firestore CRUD operations with counter support
 * Provides real-time sync with Firestore collection
 * @param {string} collectionPath - Firestore collection path
 * @param {string} userId - Current user ID
 * @returns {Object} { items, loading, error, add, update, remove }
 */
export function useFirestoreCrud(collectionPath, userId) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (collectionPath === 'placeholder' || !userId) {
            setItems([]);
            setLoading(false);
            return;
        }

        if (!db) return;

        const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setItems(data);
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
            console.error('useFirestoreCrud snapshot error', err);
        });

        return () => unsubscribe();
    }, [collectionPath, userId]);

    /**
     * Add new item with optional counter-based internal ID
     * @param {Object} payload - Item data
     * @param {string} prefix - Optional prefix for internal ID (e.g., 'U', 'K', 'P')
     */
    const add = async (payload, prefix = null) => {
        if (!db || !userId) return;

        try {
            const now = new Date();
            const nowISO = now.toISOString();

            let finalPayload = { ...payload, createdAt: nowISO, updatedAt: nowISO };

            if (prefix) {
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = String(now.getFullYear()).slice(-2);
                const counterKey = `${prefix}_${month}_${year}`;

                const counterRef = doc(db, `artifacts/default-app-id/users/${userId}/counters`, counterKey);
                const currentCounterDoc = await getDoc(counterRef);
                let currentCount = currentCounterDoc.exists() ? currentCounterDoc.data().count : 0;
                const nextCount = currentCount + 1;

                await setDoc(counterRef, { count: nextCount, lastUpdated: nowISO }, { merge: true });

                const internalId = `${prefix}${nextCount}/${month}/${year}`;
                finalPayload.internalId = internalId;
            }

            const docRef = await addDoc(collection(db, collectionPath), finalPayload);
            toast.success('Dodano element');
            return docRef.id;
        } catch (e) {
            console.error('add error', e);
            toast.error('Błąd dodawania');
            throw e;
        }
    };

    /**
     * Update existing item
     * @param {string} id - Document ID
     * @param {Object} payload - Updated data
     */
    const update = async (id, payload) => {
        try {
            await setDoc(doc(db, collectionPath, id), { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
            toast.success('Zaktualizowano element');
        } catch (e) {
            console.error('update error', e);
            toast.error('Błąd aktualizacji');
            throw e;
        }
    };

    /**
     * Remove item
     * @param {string} id - Document ID
     */
    const remove = async (id) => {
        try {
            await deleteDoc(doc(db, collectionPath, id));
            toast.success('Usunięto element');
        } catch (e) {
            console.error('delete error', e);
            toast.error('Błąd usuwania');
            throw e;
        }
    };

    return { items, loading, error, add, update, remove };
}