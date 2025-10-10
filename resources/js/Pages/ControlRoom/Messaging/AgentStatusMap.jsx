import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/Components/ui/card';

const AgentStatusMap = ({ agents, onAgentClick }) => {
    const mapRef = useRef(null);
    const markersRef = useRef({});

    useEffect(() => {
        if (!mapRef.current) {
            // Initialize map
            mapRef.current = L.map('agent-map').setView([-1.2921, 36.8219], 12);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }

        // Update markers for all agents
        agents.forEach(agent => {
            if (agent.latitude && agent.longitude) {
                // Create or update marker
                if (markersRef.current[agent.id]) {
                    // Update existing marker position
                    markersRef.current[agent.id].setLatLng([agent.latitude, agent.longitude]);
                } else {
                    // Create new marker
                    const markerColor = getMarkerColor(agent.status);
                    const marker = L.circleMarker(
                        [agent.latitude, agent.longitude],
                        {
                            radius: 8,
                            fillColor: markerColor,
                            color: '#fff',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }
                    ).addTo(mapRef.current);

                    // Add popup
                    marker.bindPopup(`
                        <div class="text-sm">
                            <strong>${agent.name}</strong><br>
                            Status: ${agent.status}<br>
                            ${agent.current_assignment || 'No current assignment'}
                        </div>
                    `);

                    // Add click handler
                    marker.on('click', () => {
                        onAgentClick(agent);
                    });

                    markersRef.current[agent.id] = marker;
                }

                // Update popup content
                const popup = markersRef.current[agent.id].getPopup();
                popup.setContent(`
                    <div class="text-sm">
                        <strong>${agent.name}</strong><br>
                        Status: ${agent.status}<br>
                        ${agent.current_assignment || 'No current assignment'}
                    </div>
                `);
            }
        });

        // Remove markers for agents no longer in the list
        Object.keys(markersRef.current).forEach(id => {
            if (!agents.find(a => a.id.toString() === id)) {
                mapRef.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = {};
            }
        };
    }, [agents]);

    const getMarkerColor = (status) => {
        switch (status) {
            case 'available':
                return '#10B981'; // Green
            case 'on_duty':
                return '#3B82F6'; // Blue
            case 'emergency':
                return '#EF4444'; // Red
            default:
                return '#6B7280'; // Gray
        }
    };

    return (
        <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Agent Locations</h3>
            <div id="agent-map" className="h-[500px] rounded-lg" />
        </Card>
    );
};

export default AgentStatusMap;