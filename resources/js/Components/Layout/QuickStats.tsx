import React from 'react';
import useCounters from '@/Hooks/useCounters';

interface QuickStatsProps {
    showApprovals?: boolean;
    showDowns?: boolean;
    showMessages?: boolean;
}

export default function QuickStats({ 
    showApprovals = true, 
    showDowns = true, 
    showMessages = true 
}: QuickStatsProps) {
    const { counters } = useCounters();
    
    const stats = [
        showApprovals && {
            label: 'Approvals',
            value: (Number(counters?.requisitions_pending_admin || 0) + Number(counters?.finance_approvals_pending || 0)),
            color: 'bg-amber-500'
        },
        showDowns && {
            label: 'Open Downs',
            value: counters?.control_downs_active || 0,
            color: 'bg-red-500'
        },
        showMessages && {
            label: 'Messages',
            value: counters?.notifications_unread || 0,
            color: 'bg-blue-500'
        },
    ].filter((s): s is { label: string; value: number; color: string } => Boolean(s && s.value > 0));

    if (stats.length === 0) return null;

    return (
        <div className="hidden lg:flex items-center gap-2 mr-4">
            {stats.map((stat) => (
                <div key={stat.label} className={`${stat.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                    {stat.value} {stat.label}
                </div>
            ))}
        </div>
    );
}
