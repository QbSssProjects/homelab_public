import React, { useState, useEffect } from 'react';

/**
 * Form for creating/editing parameters
 * Includes visibility toggle for table display
 * @param {Object} item - Initial parameter data
 * @param {Function} onSave - Save handler
 * @param {Function} onClose - Close handler
 * @param {string} fieldLabel - Label for the name field
 */
const ParameterForm = ({ item, onSave, onClose, fieldLabel }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        isVisible: item?.isVisible || false,
    });

    useEffect(() => {
        setFormData({
            name: item?.name || '',
            isVisible: item?.isVisible || false,
        });
    }, [item]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <label className="block">
                <span className="text-gray-700">{fieldLabel}:</span>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                />
            </label>

            <label className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border">
                <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-5 w-5"
                />
                <span className="text-gray-700 font-medium">Czy widzialny w spisie komponentów?</span>
            </label>

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
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={!formData.name.trim()}
                >
                    Zapisz
                </button>
            </div>
        </form>
    );
};

export default ParameterForm;