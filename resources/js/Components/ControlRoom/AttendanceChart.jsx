import React from 'react';
import { Bar } from 'react-chartjs-2';

const AttendanceChart = ({ zones }) => {
    const chartData = {
        labels: zones.map(zone => zone.name),
        datasets: [
            {
                label: 'Present Guards',
                data: zones.map(zone => zone.weeklyStats[zone.weeklyStats.length - 1].present_guards),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1
            },
            {
                label: 'Required Guards',
                data: zones.map(zone => zone.requiredGuards),
                backgroundColor: 'rgba(59, 130, 246, 0.4)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Guard Attendance by Zone'
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
        <Bar data={chartData} options={options} height={80} />
    );
};

export default AttendanceChart;