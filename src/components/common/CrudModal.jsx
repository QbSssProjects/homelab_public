import React from 'react';
import CategoryForm from '../forms/CategoryForm';
import ParameterForm from '../forms/ParameterForm';

/**
 * Generic modal for CRUD operations
 * Renders appropriate form based on collection type
 * @param {Object} item - Item being edited (null for new)
 * @param {Function} onClose - Close handler
 * @param {Function} onSave - Save handler
 * @param {string} fieldLabel - Label for main field
 * @param {string} collectionName - Collection name (categories/parameters)
 * @param {Array} allParameters - All available parameters (for categories)
 */
const CrudModal = ({ item, onClose, onSave, fieldLabel, collectionName, allParameters }) => {
    const isCategoryCrud = collectionName === 'categories';

    const filteredParameters = isCategoryCrud
        ? allParameters.filter(p => p.isVisible)
        : allParameters;

    const FormComponent = isCategoryCrud ? CategoryForm : ParameterForm;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold">
                        {item ? 'Edytuj' : 'Dodaj nowy'} {isCategoryCrud ? 'Kategorię' : fieldLabel}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 text-3xl">&times;</button>
                </div>

                <div className="p-0">
                    <FormComponent
                        item={item}
                        onSave={onSave}
                        onClose={onClose}
                        fieldLabel={fieldLabel}
                        allParameters={allParameters}
                    />
                </div>
            </div>
        </div>
    );
};

export default CrudModal;