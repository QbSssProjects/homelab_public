import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';

// Config & Utils
import { initFirebase, DOCUMENTS_COLLECTION_NAME } from './config/firebase';
import { fetchUserRole } from './utils/helpers';

// Hooks
import { useFirestoreCrud } from './hooks/useFirestoreCrud';

// Components
import LoginView from './components/views/LoginView';  // NEW
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/views/Dashboard';
import ComponentsView from './components/views/ComponentsView';
import GenericCrudView from './components/views/GenericCrudView';
import DocumentationView from './components/views/DocumentationView';
import MigrationTool from './components/views/MigrationTool';

// Styles
import './assets/DejaVuSans-normal.js';

const Unauthorized = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold text-red-700 mb-6">Brak autoryzacji</h1>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">Nie masz uprawnień do wykonania tej akcji.</p>
        </div>
    </div>
);

const App = () => {
    const [ready, setReady] = useState(false);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState('User');
    const [currentView, setCurrentView] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);  // NEW

    // Firestore collection paths
    const categoriesCrudPath = userId ? `artifacts/default-app-id/users/${userId}/categories` : null;
    const parametersCrudPath = userId ? `artifacts/default-app-id/users/${userId}/parameters` : null;
    const componentsCrudPath = userId ? `artifacts/default-app-id/users/${userId}/components` : null;

    // Fetch data using custom hook
    const { items: categories } = useFirestoreCrud(categoriesCrudPath || 'placeholder', userId);
    const { items: parameters } = useFirestoreCrud(parametersCrudPath || 'placeholder', userId);
    const { items: components } = useFirestoreCrud(componentsCrudPath || 'placeholder', userId);
    const {
        items: documents,
        add: addDocument,
        remove: removeDocument,
        update: updateDocument
    } = useFirestoreCrud(DOCUMENTS_COLLECTION_NAME, userId);

    // Initialize Firebase and handle authentication
    useEffect(() => {
        const { auth } = initFirebase();
        if (!auth) {
            console.error('Firebase nie jest skonfigurowany. Sprawdź konfigurację');
            return;
        }

        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthenticated(true);
                const r = await fetchUserRole(user.uid);
                setRole(r);
                setReady(true);
            } else {
                setUserId(null);
                setIsAuthenticated(false);
                setReady(true);  // Changed to true so we can show login screen
            }
        });

        return () => unsub();
    }, []);

    const handleLogout = async () => {
        const { auth } = initFirebase();
        await auth.signOut();
        setUserId(null);
        setIsAuthenticated(false);
        setReady(false);
        toast('Wylogowano pomyślnie');
    };

    const handleLoginSuccess = (user) => {
        setUserId(user.uid);
        setIsAuthenticated(true);
    };

    // Loading screen
    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
                    <p className="text-xl font-semibold">Ładowanie...</p>
                </div>
            </div>
        );
    }

    // Show login if not authenticated
    if (!isAuthenticated) {
        return <LoginView onLoginSuccess={handleLoginSuccess} />;
    }

    // View rendering based on current selection
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard components={components} categories={categories} />;

            case 'components':
                return (
                    <ComponentsView
                        userId={userId}
                        categories={categories}
                        parameters={parameters}
                    />
                );

            case 'categories':
                return role === 'Admin' ? (
                    <GenericCrudView
                        userId={userId}
                        collectionName="categories"
                        title="CRUD: Kategorie"
                        fieldLabel="Nazwa kategorii"
                        allParameters={parameters}
                    />
                ) : <Unauthorized />;

            case 'parameters':
                return role === 'Admin' ? (
                    <GenericCrudView
                        userId={userId}
                        collectionName="parameters"
                        title="CRUD: Parametry"
                        fieldLabel="Nazwa parametru"
                    />
                ) : <Unauthorized />;

            case 'documentation':
                return (
                    <DocumentationView
                        components={components}
                        categories={categories}
                        parameters={parameters}
                        documents={documents}
                        addDocument={addDocument}
                        removeDocument={removeDocument}
                        updateDocument={updateDocument}
                        userId={userId}
                    />
                );

            case 'migration':
                return <MigrationTool userId={userId} />;

            default:
                return <Dashboard components={components} categories={categories} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Toaster />
            <Sidebar
                userId={userId}
                role={role}
                currentView={currentView}
                setView={setCurrentView}
                onLogout={handleLogout}
            />
            <main className="flex-1 ml-64 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

export default App;