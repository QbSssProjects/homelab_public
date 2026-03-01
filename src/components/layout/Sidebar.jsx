import React from 'react';

/**
 * Main navigation sidebar component
 * Displays navigation items based on user role
 * @param {string} userId - Current user ID
 * @param {string} role - User role (Admin/User)
 * @param {string} currentView - Currently active view
 * @param {Function} setView - Function to change view
 * @param {Function} onLogout - Logout handler
 */
const Sidebar = ({ userId, role, currentView, setView, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Panel Główny', icon: '🏠', roles: ['Admin', 'User'] },
        { id: 'components', label: 'Ewidencja Komponentów', icon: '📦', roles: ['Admin', 'User'] },
        { id: 'categories', label: 'CRUD: Kategorie', icon: '🏷️', roles: ['Admin'] },
        { id: 'parameters', label: 'CRUD: Parametry', icon: '⚙️', roles: ['Admin'] },
        { id: 'documentation', label: 'Dokumentacja', icon: '📄', roles: ['Admin', 'User'] },
        { id: 'migration', label: 'Migracja z LocalStorage', icon: '🔄', roles: ['Admin'] },
    ];

    return (
        <div className="w-64 bg-gray-800 text-white flex flex-col fixed h-full shadow-2xl">
            <div className="p-4 text-xl font-bold border-b border-gray-700 bg-blue-700">
                Homelab Ewidencja
            </div>
            <nav className="flex-grow p-2 space-y-2">
                {navItems.filter(i => i.roles.includes(role)).map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`w-full text-left flex items-center px-4 py-2 rounded-lg transition-colors duration-150 ${
                            currentView === item.id
                                ? 'bg-blue-600 text-white shadow-md font-semibold'
                                : 'hover:bg-gray-700 text-gray-300'
                        }`}
                    >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 bg-gray-900">
                <p className="text-sm font-medium text-gray-400">UID:</p>
                <p className="text-xs font-mono break-all mb-2 text-green-400">{userId}</p>
                <p className="text-sm font-medium text-gray-400">Rola:</p>
                <p className="text-md font-semibold mb-2">{role}</p>
                <button
                    onClick={onLogout}
                    className="w-full text-sm py-1.5 px-3 bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-150 shadow-md"
                >
                    Wyloguj
                </button>
            </div>
        </div>
    );
};

export default Sidebar;