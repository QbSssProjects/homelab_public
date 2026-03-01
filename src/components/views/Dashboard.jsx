import React, { useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getNameById } from '../../utils/helpers';

/**
 * Dashboard view with statistics and charts
 * Displays component counts, total value, and distribution charts
 * @param {Array} components - List of components
 * @param {Array} categories - List of categories
 */
const Dashboard = ({ components, categories }) => {
    const { totalValue, byCategory, byStatus } = useMemo(() => {
        const categoryCounts = {};
        const statusCounts = {};
        let totalValue = 0;
        const safeComponents = components || [];
        const safeCategories = categories || [];

        safeComponents.forEach(comp => {
            const categoryId = comp.categoryId || 'brak_kategorii';
            const status = comp.status || 'Nieznany';

            categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            totalValue += comp.value || 0;
        });

        const byCategory = Object.keys(categoryCounts).map(categoryId => ({
            name: getNameById(categoryId, safeCategories),
            value: categoryCounts[categoryId],
        }));

        const byStatus = Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status],
        }));

        return { totalValue, byStatus, byCategory };
    }, [components, categories]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF197F', '#19FFD1'];

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel Główny – Statystyki</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-500">Liczba komponentów</p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">{(components || []).length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-500">Wartość całkowita</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                        {totalValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                    <p className="text-sm font-medium text-gray-500">Unikalne kategorie</p>
                    <p className="text-2xl font-bold mt-1">{byCategory.length}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Rozkład komponentów wg kategorii</h2>
                <div style={{ height: 300 }}>
                    {byCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie dataKey="value" nameKey="name" data={byCategory} label outerRadius={90}>
                                    {byCategory.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500">Brak danych komponentów do wyświetlenia wykresu.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Rozkład komponentów wg statusu</h2>
                <div style={{ height: 300 }}>
                    {byStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie dataKey="value" nameKey="name" data={byStatus} label outerRadius={90}>
                                    {byStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, `Status: ${name}`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-gray-500">Brak danych komponentów do wyświetlenia wykresu.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;