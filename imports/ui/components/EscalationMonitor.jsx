import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

export const EscalationMonitor = ({ canView }) => {
    const [stats, setStats] = useState({
        total: 0,
        warning: 0,
        critical: 0,
        unacknowledged: 0,
        recent24h: 0
    });
    const [criticalTickets, setCriticalTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // const user = useTracker(() => Meteor.user());
    // const canView = user?.roles?.includes('admin') || user?.roles?.includes('support');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const statsResult = await Meteor.callAsync('escalations.getStats');
            setStats(statsResult);

            const ticketsResult = await Meteor.callAsync('escalations.getCriticalTickets');
            setCriticalTickets(ticketsResult);
        } catch (error) {
            console.error('Error fetching escalation data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (canView) {
            fetchData();
            // Refresh every minute
            const interval = setInterval(fetchData, 60000);
            return () => clearInterval(interval);
        }
    }, [canView, refreshTrigger]);

    const handleAcknowledge = async (escalationId) => {
        try {
            await Meteor.callAsync('escalations.acknowledge', escalationId);
            setRefreshTrigger(prev => prev + 1); // Trigger refresh
        } catch (error) {
            alert('Failed to acknowledge: ' + error.message);
        }
    };

    if (!canView) return null;

    if (isLoading && stats.total === 0) {
        return <div className="p-4 text-center">Loading escalation data...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="text-2xl mr-2">🚨</span>
                    SLA Escalation Monitor
                </h2>
                <button
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full"
                    title="Refresh Data"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.051M20 20v-5h-.051M9 17h6M15 9l-6 6" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13a8.1 8.1 0 0015.5 2m.5-2a8.1 8.1 0 01-15.5-2" />
                    </svg>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-sm text-gray-600">Warnings (75%)</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.warning}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-gray-600">Critical (90%)</div>
                    <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-gray-600">Unacknowledged</div>
                    <div className="text-2xl font-bold text-yellow-700">{stats.unacknowledged}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-600">Recent (24h)</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.recent24h}</div>
                </div>
            </div>

            {/* Critical Tickets List */}
            {criticalTickets.length > 0 ? (
                <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        Critical Unacknowledged Tickets
                    </h3>
                    <div className="space-y-3">
                        {criticalTickets.map((escalation) => (
                            <div key={escalation._id} className="border border-red-200 rounded-lg p-3 bg-red-50 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <div className="flex items-center">
                                        <span className="font-bold text-red-700 mr-2">{escalation.ticketNumber}</span>
                                        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full border border-red-300">Could Breach Soon</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium text-gray-800">{escalation.ticket?.title}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {escalation.percentageUsed}% Time Used • Priority: {escalation.metadata?.priority} •
                                        Escalated: {new Date(escalation.escalatedAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="mt-2 md:mt-0 flex space-x-2">
                                    <a
                                        href={`/tickets/${escalation.ticketId}`}
                                        className="px-3 py-1 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => handleAcknowledge(escalation._id)}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition shadow-sm"
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-gray-400 text-3xl mb-2">✓</div>
                    <div className="text-gray-500">No critical unacknowledged escalations</div>
                </div>
            )}
        </div>
    );
};
