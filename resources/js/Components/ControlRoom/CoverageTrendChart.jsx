import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

const CoverageTrendChart = ({ zones }) => {
    const chartData = useMemo(() => {
        const dates = zones[0]?.weeklyStats.map(stat => stat.date) || [];
        
        return {
            labels: dates,
            datasets: zones.map(zone => ({
                label: zone.name,
                data: zone.weeklyStats.map(stat => stat.coverage_rate),
                borderColor: getZoneColor(zone.name),
                backgroundColor: getZoneColor(zone.name, 0.1),
                tension: 0.4,
                fill: true
            }))
        };
    }, [zones]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Zone Coverage Trends'
            }
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: {
                    callback: value => `${value}%`
                }
            }
        }
    };

    return (
        <Line data={chartData} options={options} height={80} />
    );
};

// Helper function to generate consistent colors for zones
const getZoneColor = (zoneName, alpha = 1) => {
    const colors = [
        `rgba(59, 130, 246, ${alpha})`,   // Blue
        `rgba(16, 185, 129, ${alpha})`,   // Green
        `rgba(245, 158, 11, ${alpha})`,   // Yellow
        `rgba(239, 68, 68, ${alpha})`,    // Red
        `rgba(139, 92, 246, ${alpha})`,   // Purple
        `rgba(236, 72, 153, ${alpha})`,   // Pink
    ];
    
    // Generate a consistent index based on zone name
    const index = zoneName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
};

export default CoverageTrendChart;