'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getChartDataForClient } from '@/src/app/admin/actions';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- TypeScript Type Definitions ---
type ChartData = { date: string; totalVolume: number; maxWeight: number; singleSetVolume: number; e1rm: number; };
type Metric = 'totalVolume' | 'maxWeight' | 'singleSetVolume' | 'e1rm';

interface ProgressChartProps {
    clientId: string;
    selectedExercise: string | null; // Receives the selected exercise as a prop
}

// --- Metric Configuration Object ---
// This object makes it easy to manage chart settings for each metric
const metricConfig = {
    totalVolume: { label: 'Total Volume (kg)', color: '#38bdf8' },
    maxWeight: { label: 'Max Weight (kg)', color: '#FBBF24' },
    singleSetVolume: { label: 'Best Set Volume (kg)', color: '#34d399' },
    e1rm: { label: 'Estimated 1-Rep Max (kg)', color: '#f87171' },
};

export function ProgressChart({ clientId, selectedExercise }: ProgressChartProps) {
    const [selectedMetric, setSelectedMetric] = useState<Metric>('totalVolume');
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch and update chart data when the selected exercise prop changes
    useEffect(() => {
        if (!selectedExercise) {
            setChartData([]); // Clear data if no exercise is selected
            return;
        };

        const fetchData = async () => {
            setIsLoading(true);
            const data = await getChartDataForClient(clientId, selectedExercise);
            setChartData(data);
            setIsLoading(false);
        };
        fetchData();
    }, [selectedExercise, clientId]);

    // If no exercise is selected, render a placeholder message
    if (!selectedExercise) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Performance Tracker</h2>
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 text-center text-gray-400">
                    Select an exercise from the log history filters to view its progress chart.
                </div>
            </div>
        );
    }

    // --- Dynamic Chart Data & Options ---
    const data = {
        labels: chartData.map(d => d.date),
        datasets: [{
            label: metricConfig[selectedMetric].label,
            data: chartData.map(d => d[selectedMetric]),
            borderColor: metricConfig[selectedMetric].color,
            backgroundColor: metricConfig[selectedMetric].color,
            tension: 0.1,
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#d1d5db' } }, // Make legend text light gray
        },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                ticks: { color: '#9ca3af' },
                grid: { color: '#374151' },
                title: { display: true, text: metricConfig[selectedMetric].label, color: '#d1d5db' },
            },
        },
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-4">Performance Tracker: {selectedExercise}</h2>
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                <div className="mb-4">
                    <label htmlFor="metric" className="text-xs font-semibold text-gray-400">Metric</label>
                    <select id="metric" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value as Metric)} className="mt-1 block w-full max-w-xs rounded-md bg-white/5 py-2 pl-3 text-white ring-1 ring-white/10">
                        <option value="totalVolume" className="text-black">Total Volume</option>
                        <option value="maxWeight" className="text-black">Max Weight</option>
                        <option value="singleSetVolume" className="text-black">Best Set Volume</option>
                        <option value="e1rm" className="text-black">Est. 1-Rep Max</option>
                    </select>
                </div>
                {isLoading ? <p className="text-center py-10">Loading chart data...</p> : <Line options={options} data={data} />}
            </div>
        </div>
    );
}

