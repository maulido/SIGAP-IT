import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Ticket Trends Chart (Line Chart)
export const TicketTrendsChart = ({ days = 30 }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Meteor.callAsync('dashboard.ticketTrends', { days })
            .then(result => {
                const chartData = {
                    labels: result.map(d => new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })),
                    datasets: [
                        {
                            label: 'Created',
                            data: result.map(d => d.created),
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.4,
                        },
                        {
                            label: 'Resolved',
                            data: result.map(d => d.resolved),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                        },
                    ],
                };
                setData(chartData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading ticket trends:', err);
                setLoading(false);
            });
    }, [days]);

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Ticket Trends (Last ${days} Days)`,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

// SLA Compliance Chart (Doughnut Chart)
export const SLAComplianceChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Meteor.callAsync('dashboard.slaCompliance')
            .then(result => {
                const chartData = {
                    labels: ['SLA Met', 'SLA Breached'],
                    datasets: [
                        {
                            data: [result.met, result.breached],
                            backgroundColor: [
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: [
                                'rgb(16, 185, 129)',
                                'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                        },
                    ],
                };
                setData({ chartData, stats: result });
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading SLA compliance:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `SLA Compliance (${data.stats.percentage}% Met)`,
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Doughnut data={data.chartData} options={options} />
        </div>
    );
};

// Category Distribution Chart (Bar Chart)
export const CategoryDistributionChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Meteor.callAsync('dashboard.categoryDistribution')
            .then(result => {
                const chartData = {
                    labels: result.map(d => d.category),
                    datasets: [
                        {
                            label: 'Tickets',
                            data: result.map(d => d.count),
                            backgroundColor: [
                                'rgba(99, 102, 241, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(251, 146, 60, 0.8)',
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(156, 163, 175, 0.8)',
                            ],
                            borderColor: [
                                'rgb(99, 102, 241)',
                                'rgb(139, 92, 246)',
                                'rgb(236, 72, 153)',
                                'rgb(251, 146, 60)',
                                'rgb(34, 197, 94)',
                                'rgb(156, 163, 175)',
                            ],
                            borderWidth: 2,
                        },
                    ],
                };
                setData(chartData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading category distribution:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Tickets by Category',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

// Priority Breakdown Chart (Pie Chart)
export const PriorityBreakdownChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Meteor.callAsync('dashboard.priorityBreakdown')
            .then(result => {
                const chartData = {
                    labels: result.map(d => d.priority),
                    datasets: [
                        {
                            data: result.map(d => d.count),
                            backgroundColor: [
                                'rgba(156, 163, 175, 0.8)', // Low - Gray
                                'rgba(59, 130, 246, 0.8)',  // Medium - Blue
                                'rgba(251, 146, 60, 0.8)',  // High - Orange
                                'rgba(239, 68, 68, 0.8)',   // Critical - Red
                            ],
                            borderColor: [
                                'rgb(156, 163, 175)',
                                'rgb(59, 130, 246)',
                                'rgb(251, 146, 60)',
                                'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                        },
                    ],
                };
                setData(chartData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading priority breakdown:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Tickets by Priority',
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Pie data={data} options={options} />
        </div>
    );
};

// Status Distribution Chart (Doughnut Chart)
export const StatusDistributionChart = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Meteor.callAsync('dashboard.statusDistribution')
            .then(result => {
                const chartData = {
                    labels: result.map(d => d.status),
                    datasets: [
                        {
                            data: result.map(d => d.count),
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',  // Open - Blue
                                'rgba(251, 146, 60, 0.8)',  // In Progress - Orange
                                'rgba(251, 191, 36, 0.8)',  // Pending - Yellow
                                'rgba(16, 185, 129, 0.8)',  // Resolved - Green
                                'rgba(107, 114, 128, 0.8)', // Closed - Gray
                                'rgba(239, 68, 68, 0.8)',   // Rejected - Red
                            ],
                            borderColor: [
                                'rgb(59, 130, 246)',
                                'rgb(251, 146, 60)',
                                'rgb(251, 191, 36)',
                                'rgb(16, 185, 129)',
                                'rgb(107, 114, 128)',
                                'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                        },
                    ],
                };
                setData(chartData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading status distribution:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-8 text-gray-600">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8 text-gray-600">No data available</div>;
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Tickets by Status',
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Doughnut data={data} options={options} />
        </div>
    );
};
