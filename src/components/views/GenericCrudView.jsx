import React, { useState, useMemo } from 'react';
import { useFirestoreCrud } from '../../hooks/useFirestoreCrud';
import CrudModal from '../common/CrudModal';

/**
 * Generic CRUD view for categories and parameters
 * Features search, filtering, and table display
 * @param {string} userId - Current user ID
 * @param {string} collectionName - Collection name (categories/parameters)
 * @param {string} title - Page title
 * @param {string} fieldLabel - Label for main field
 * @param {Array} allParameters - All parameters (for categories only)
 */
const GenericCrudView = ({ userId, collectionName, title, fieldLabel, allParameters }) => {
    const path = `artifacts/default-app-id/users/${userId}/${collectionName}`;
    const { items, loading, add, update, remove } = useFirestoreCrud(path, userId);

    const [searchTerm, setSearchTerm] = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [current, setCurrent] = useState(null);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        return items.filter(item => {
            if (collectionName === 'parameters' && visibilityFilter !== 'all') {
                if (visibilityFilter === 'visible' && !item.isVisible) return false;
                if (visibilityFilter === 'hidden' && item.isVisible) return false;
            }

            if (!term) return true;

            return (
                item.name.toLowerCase().includes(term) ||
                item.id.toLowerCase().includes(term) ||
                (item.internalId && item.internalId.toLowerCase().includes(term))
            );
        });
    }, [items, searchTerm, visibilityFilter, collectionName]);

    const open = (item = null) => {
        setCurrent(item);
        setIsModalOpen(true);
    };

    const close = () => {
        setCurrent(null);
        setIsModalOpen(false);
    };

    const handleSave = async (payload) => {
        if (current) {
            await update(current.id, { ...current, ...payload });
        } else {
            let prefix = null;
            if (collectionName === 'categories') prefix = 'K';
            else if (collectionName === 'parameters') prefix = 'P';

            await add(payload, prefix);
        }
        close();
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{title}</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`Wyszukaj ${fieldLabel.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                       focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {collectionName === 'parameters' && (
                    <select
                        value={visibilityFilter}
                        onChange={(e) => setVisibilityFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg
                     focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                    >
                        <option value="all">Wszystkie parametry</option>
                        <option value="visible">Tylko widoczne</option>
                        <option value="hidden">Tylko ukryte</option>
                    </select>
                )}

                <button
                    onClick={() => open()}
                    className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700
                   flex items-center justify-center gap-2 min-w-[140px]"
                >
                    <span>+</span> Dodaj Nowy
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-between items-center">
                <div className="flex gap-4">
                    <p className="text-gray-600">
                        {searchTerm || visibilityFilter !== 'all'
                            ? `Znaleziono ${filteredItems.length} z ${items.length} ${fieldLabel.toLowerCase()}`
                            : `Liczba elementów: ${items.length}`
                        }
                    </p>
                    {collectionName === 'parameters' && (
                        <p className="text-gray-600">
                            Widoczne: {items.filter(i => i.isVisible).length}
                        </p>
                    )}
                </div>
                {(searchTerm || visibilityFilter !== 'all') && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setVisibilityFilter('all');
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Wyczyść filtry
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nr Wewn.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {fieldLabel}
                        </th>
                        {collectionName === 'parameters' && (
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Widoczność
                            </th>
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akcje
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="p-6 text-center">
                                <div className="flex items-center justify-center text-gray-500">
                                    Ładowanie...
                                </div>
                            </td>
                        </tr>
                    ) : filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-500">
                                {searchTerm || visibilityFilter !== 'all'
                                    ? `Nie znaleziono ${fieldLabel.toLowerCase()} dla wybranych filtrów`
                                    : `Brak ${fieldLabel.toLowerCase()}`
                                }
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map(i => (
                            <tr key={i.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                    {i.internalId || '—'}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                    {i.id}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {i.name}
                                </td>
                                {collectionName === 'parameters' && (
                                    <td className="px-6 py-4 text-center">
                      <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${i.isVisible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'}`}
                      >
                        {i.isVisible ? 'Widoczny' : 'Ukryty'}
                      </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => open(i)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        Edytuj
                                    </button>
                                    <button
                                        onClick={() => remove(i.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Usuń
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <CrudModal
                    item={current}
                    onClose={close}
                    onSave={handleSave}
                    fieldLabel={fieldLabel}
                    collectionName={collectionName}
                    allParameters={allParameters}
                />
            )}
        </div>
    );
};

export default GenericCrudView;