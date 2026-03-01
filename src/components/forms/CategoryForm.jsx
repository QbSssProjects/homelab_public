import React, { useState, useEffect } from 'react';

/**
 * Form for creating/editing categories
 * Allows assignment of parameters to categories
 * @param {Object} item - Initial category data
 * @param {Function} onSave - Save handler
 * @param {Function} onClose - Close handler
 * @param {string} fieldLabel - Label for the name field
 * @param {Array} allParameters - List of all parameters (including invisible ones)
 */
const CategoryForm = ({ item, onSave, onClose, fieldLabel, allParameters }) => {
    const [name, setName] = useState(item?.name || '');
    const [selectedParameterIds, setSelectedParameterIds] = useState(item?.parameterIds || []);

    const handleParameterToggle = (id) => {
        setSelectedParameterIds(prev =>
            prev.includes(id)
                ? prev.filter(pid => pid !== id)
                : [...prev, id]
        );
    };

    useEffect(() => {
        setName(item?.name || '');
        setSelectedParameterIds(item?.parameterIds || []);
    }, [item]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const payload = {
            name: name.trim(),
            parameterIds: selectedParameterIds,
        };

        onSave(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{fieldLabel}</label>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            {allParameters && (
                <div className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-bold text-gray-800 mb-2">Przypisane Parametry:</label>
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {allParameters.length === 0 ? (
                            <p className="text-sm text-gray-500 col-span-2">
                                Brak zdefiniowanych parametrów. Dodaj je w widoku \`CRUD: Parametry\`.
                            </p>
                        ) : (
                            allParameters.map(p => (
                                <div key={p.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`param-${p.id}`}
                                        checked={selectedParameterIds.includes(p.id)}
                                        onChange={() => handleParameterToggle(p.id)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`param-${p.id}`}
                                        className="ml-2 text-sm text-gray-700 cursor-pointer flex items-center"
                                    >
                                        <span>{p.name}</span>
                                        {!p.isVisible && (
                                            <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                                niewidoczny
                                            </span>
                                        )}
                                    </label>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Anuluj
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={!name.trim()}
                >
                    Zapisz
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;