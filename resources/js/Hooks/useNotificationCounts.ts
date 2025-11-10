import { useState, useEffect } from 'react';
import axios from 'axios';

interface NotificationCounts {
    incidents: number;
    flags: number;
    downs: number;
}

export function useNotificationCounts() {
    const [counts, setCounts] = useState<NotificationCounts>({
        incidents: 0,
        flags: 0,
        downs: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCounts = async () => {
        try {
            setLoading(true);
            const response = await axios.get<NotificationCounts>('/api/notifications/counts');
            setCounts(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch notification counts');
            console.error('Error fetching notification counts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
        
        // Set up polling every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        
        return () => clearInterval(interval);
    }, []);

    return {
        counts,
        loading,
        error,
        refresh: fetchCounts
    };
}