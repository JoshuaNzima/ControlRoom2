import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface Zone {
    id: number;
    name: string;
    coverage: number;
    guards: number;
    required_guards: number;
    sites: number;
}

interface AttendanceChartProps {
    zones?: Zone[];
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ zones = [] }) => {
    const chartData = {
        labels: zones.map(zone => zone.name),
        datasets: [
            {
                label: 'Active Guards',
                data: zones.map(zone => zone.guards || 0),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
            },
            {
                label: 'Required Guards',
                data: zones.map(zone => zone.required_guards || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.4)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }
        ]
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Guard Coverage by Zone'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <div style={{ height: '300px' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default AttendanceChart;