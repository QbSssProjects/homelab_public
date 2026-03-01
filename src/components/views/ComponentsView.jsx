import React, { useState } from 'react';
import { useFirestoreCrud } from '../../hooks/useFirestoreCrud';
import ComponentForm from '../forms/ComponentForm';

/**
 * Main view for component CRUD operations
 * Features search, filtering, and table display
 * @param {string} userId - Current user ID
 * @param {Array} categories - List of categories
 * @param {Array} parameters - List of parameters
 */
const ComponentsView = ({ userId, categories, parameters }) => {
    const collectionPath = `artifacts/default-app-id/users/${userId}/components`;
    const [searchTerm, setSearchTerm] = useState('');
    const { items: components, loading, add, update, remove } = useFirestoreCrud(collectionPath, userId);

    const [editing, setEditing] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const statuses = ['W Użyciu', 'Zapas', 'Usunięty', 'Serwis', 'Scrap', "Sprzedany", "W realizacji"];

    const filtered = components.filter((c) => {
        const term = searchTerm.toLowerCase();

        const matchesBasic =
            c.name?.toLowerCase().includes(term) ||
            c.internalId?.toLowerCase().includes(term) ||
            c.id?.toLowerCase().includes(term) ||
            c.status?.toLowerCase().includes(term) ||
            categories.find(cat => cat.id === c.categoryId)?.name?.toLowerCase().includes(term);

        const matchesParams = (() => {
            if (!c.paramsData) return false;

            const matchesParamValues = Object.values(c.paramsData).some(val =>
                String(val).toLowerCase().includes(term)
            );

            const matchesParamPairs = Object.entries(c.paramsData).some(([paramId, value]) => {
                const paramName = parameters.find(p => p.id === paramId)?.name || '';
                const searchPattern = `${paramName.toLowerCase()}:${String(value).toLowerCase()}`;
                return searchPattern.includes(term);
            });

            const matchesParamNames = Object.keys(c.paramsData).some(paramId => {
                const paramName = parameters.find(p => p.id === paramId)?.name || '';
                return paramName.toLowerCase().includes(term);
            });

            return matchesParamValues || matchesParamPairs || matchesParamNames;
        })();

        const matchesCategory = !filterCategory || c.categoryId === filterCategory;
        const matchesStatus = !filterStatus || c.status === filterStatus;

        return (matchesBasic || matchesParams) && matchesCategory && matchesStatus;
    });

    const visibleParameters = (parameters || []).filter(p => p.isVisible);

    const handleCreateOrUpdate = async (payload) => {
        if (editing && editing.id) {
            await update(editing.id, payload);
            setEditing(null);
        } else {
            await add(payload, 'U');
            setEditing(null);
        }
    };

    const baseColumnCount = 7;
    const totalColumns = baseColumnCount + visibleParameters.length;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ewidencja Komponentów (CRUD)</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Szukaj komponentów..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-3">
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Wszystkie kategorie</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">Wszystkie statusy</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setEditing({})}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150 flex items-center"
                >
                    <span className="mr-1 text-lg">+</span> Dodaj Nowy Komponent
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr Wewn.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nazwa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategoria</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wartość</th>

                        {visibleParameters.map(param => (
                            <th key={param.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {param.name}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr>
                            <td colSpan={totalColumns} className="p-6 text-center">Ładowanie...</td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td colSpan={totalColumns} className="p-6 text-center">Brak komponentów</td>
                        </tr>
                    ) : filtered.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => setEditing(item)}
                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                    Edytuj
                                </button>
                                <button
                                    onClick={() => remove(item.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Usuń
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {item.internalId || '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {categories.find(c => c.id === item.categoryId)?.name || item.category || 'Nieznana'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'W Użyciu' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(item.value || 0).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                            </td>

                            {visibleParameters.map(param => (
                                <td key={param.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {item.paramsData && Object.prototype.hasOwnProperty.call(item.paramsData, param.id) &&
                                    item.paramsData[param.id] !== '' && item.paramsData[param.id] !== null
                                        ? item.paramsData[param.id]
                                        : '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {editing !== null && (
                <ComponentForm
                    initial={editing}
                    categories={categories}
                    allParameters={parameters}
                    onCancel={() => setEditing(null)}
                    onSave={handleCreateOrUpdate}
                />
            )}
        </div>
    );
};

export default ComponentsView;
