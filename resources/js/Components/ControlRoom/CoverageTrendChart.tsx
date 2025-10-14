import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

interface Zone {
    id: number;
    name: string;
    coverage: number;
    guards: number;
    required_guards: number;
    sites: number;
}

interface CoverageTrendChartProps {
    zones?: Zone[];
}

const CoverageTrendChart: React.FC<CoverageTrendChartProps> = ({ zones = [] }) => {
    const chartData = useMemo(() => {
        // Generate last 7 days labels
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return {
            labels: labels,
            datasets: zones.map(zone => ({
                label: zone.name,
                data: Array(7).fill(zone.coverage || 0), // Use current coverage for all days
                borderColor: getZoneColor(zone.name),
                backgroundColor: getZoneColor(zone.name, 0.1),
                tension: 0.4,
                fill: true
            }))
        };
    }, [zones]);

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
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
                    callback: (value: number | string) => `${value}%`
                }
            }
        }
    };

    return (
        <div style={{ height: '300px' }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

// Helper function to generate consistent colors for zones
const getZoneColor = (zoneName: string, alpha = 1) => {
    const colors = [
        `rgba(59, 130, 246, ${alpha})`,   // Blue
        `rgba(16, 185, 129, ${alpha})`,   // Green
        `rgba(245, 158, 11, ${alpha})`,   // Yellow
        `rgba(239, 68, 68, ${alpha})`,    // Red
        `rgba(139, 92, 246, ${alpha})`,   // Purple
        `rgba(236, 72, 153, ${alpha})`,   // Pink
    ];
    
    // Generate a consistent index based on zone name
    const index = zoneName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
};

export default CoverageTrendChart;