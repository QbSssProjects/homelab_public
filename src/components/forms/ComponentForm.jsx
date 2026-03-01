import React, { useState, useEffect, useMemo } from 'react';

/**
 * Form for creating/editing components
 * Dynamically renders parameter fields based on selected category
 * @param {Object} initial - Initial component data (for editing)
 * @param {Array} categories - List of categories
 * @param {Array} allParameters - List of all available parameters
 * @param {Function} onCancel - Cancel handler
 * @param {Function} onSave - Save handler
 */
const ComponentForm = ({ initial, categories, allParameters, onCancel, onSave }) => {
    const isEdit = !!initial?.id;
    const [name, setName] = useState(initial?.name || '');
    const [categoryId, setCategoryId] = useState(initial?.categoryId || (categories[0]?.id || ''));
    const [status, setStatus] = useState(initial?.status || 'W Użyciu');
    const [value, setValue] = useState(initial?.value || 0);
    const [paramsData, setParamsData] = useState(initial?.paramsData || {});

    const requiredParameterIds = useMemo(() => {
        return categories.find(c => c.id === categoryId)?.parameterIds || [];
    }, [categoryId, categories]);

    const requiredParameters = useMemo(() => {
        return allParameters.filter(p => requiredParameterIds.includes(p.id));
    }, [allParameters, requiredParameterIds]);

    useEffect(() => {
        setName(initial?.name || '');
        setCategoryId(initial?.categoryId || (categories[0]?.id || ''));
        setStatus(initial?.status || 'W Użyciu');
        setValue(initial?.value || 0);
        setParamsData(initial?.paramsData || {});
    }, [initial, categories]);

    useEffect(() => {
        setParamsData(prev => {
            const newParamsData = {};
            requiredParameterIds.forEach(pid => {
                newParamsData[pid] = prev[pid] || '';
            });
            return newParamsData;
        });
    }, [requiredParameterIds]);

    const handleParamChange = (id, val) => {
        setParamsData(prev => ({ ...prev, [id]: val }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name,
            categoryId,
            status,
            value: Number(value),
            paramsData
        };
        if (isEdit) payload.updatedAt = new Date().toISOString();
        onSave(payload);
    };

    const categoryName = categories.find(c => c.id === categoryId)?.name;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100 duration-300">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">
                        {isEdit ? `Edytuj: ${initial.name}` : 'Dodaj nowy komponent'}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                            <select
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            >
                                <option>W Użyciu</option>
                                <option>Zapas</option>
                                <option>Usunięty</option>
                                <option>Serwis</option>
                                <option>Scrap</option>
                                <option>Sprzedany</option>
                                <option>W realizacji</option>

                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wartość (PLN)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="w-full px-4 py-2 border rounded"
                            />
                        </div>
                    </div>

                    {requiredParameters.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <h4 className="text-md font-bold text-gray-800 mb-3">
                                Parametry dla kategorii: {categoryName}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {requiredParameters.map(param => (
                                    <div key={param.id} className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {param.name}
                                        </label>
                                        <textarea
                                            value={paramsData[param.id] || ''}
                                            onChange={e => handleParamChange(param.id, e.target.value)}
                                            className="w-full px-4 py-2 border rounded"
                                            placeholder={`Wprowadź wartość dla ${param.name}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="py-2 px-4 border rounded text-sm"
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 bg-blue-600 text-white rounded text-sm"
                        >
                            {isEdit ? 'Zapisz' : 'Dodaj'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComponentForm;