import React from 'react';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../config/firebase';

/**
 * Tool for migrating data from LocalStorage to Firestore
 * @param {string} userId - Current user ID
 */
const MigrationTool = ({ userId }) => {
    const LOCAL_STORAGE_KEY = 'homelab_inventory_state';

    const migrate = async () => {
        const serialized = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!serialized) {
            toast('Brak danych do migracji');
            return;
        }

        if (!window.confirm("Czy na pewno chcesz zmigrować dane z LocalStorage do Firestore?")) return;

        try {
            const parsed = JSON.parse(serialized);
            const components = parsed.components || [];
            const categories = parsed.categories || [];
            const parameters = parsed.parameters || [];

            // Add categories
            for (const cat of categories) {
                await addDoc(collection(db, `artifacts/default-app-id/users/${userId}/categories`), {
                    name: cat.name,
                    parameterIds: cat.parameterIds || [],
                    createdAt: new Date().toISOString()
                });
            }

            // Add parameters
            for (const p of parameters) {
                await addDoc(collection(db, `artifacts/default-app-id/users/${userId}/parameters`), {
                    name: p.name,
                    createdAt: new Date().toISOString()
                });
            }

            // Add components
            for (const c of components) {
                await addDoc(collection(db, `artifacts/default-app-id/users/${userId}/components`), {
                    name: c.name,
                    categoryId: c.categoryId,
                    status: c.status,
                    value: c.value,
                    paramsData: c.paramsData || {},
                    dateAdded: c.dateAdded || new Date().toISOString(),
                    createdAt: new Date().toISOString()
                });
            }

            toast.success('Migracja zakończona pomyślnie');
        } catch (e) {
            console.error('migration error', e);
            toast.error('Błąd podczas migracji');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Migracja danych z LocalStorage</h1>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="mb-4">
                    Jeśli korzystałeś z lokalnego prototypu (index.html), możesz przenieść dane do Firestore.
                </p>
                <button
                    onClick={migrate}
                    className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition"
                >
                    Przenieś dane
                </button>
            </div>
        </div>
    );
};

export default MigrationTool;