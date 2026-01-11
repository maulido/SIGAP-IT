import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

export const Reports = () => {
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [filters, setFilters] = useState({
        status: 'All',
        category: 'All',
        priority: 'All',
        assignedTo: 'All',
    });

    const [stats, setStats] = useState(null);
    const [performance, setPerformance] = useState([]);
    const [slaReport, setSlaReport] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get current user and check role
    const { currentUser, isAdmin, isSupport } = useTracker(() => {
        const user = Meteor.user();
        return {
            currentUser: user,
            isAdmin: user?.roles?.includes('admin'),
            isSupport: user?.roles?.includes('support') || user?.roles?.includes('admin'),
        };
    });

    // Get all support users for filter
    const supportUsers = useTracker(() => {
        return Meteor.users.find({
            roles: { $in: ['support', 'admin'] },
            'profile.isActive': true,
        }).fetch();
    });

    // Load report data
    const loadReportData = async () => {
        setLoading(true);
        setError('');

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of day

            // Get statistics
            const statsData = await Meteor.callAsync('reports.getTicketStats', {
                startDate: start,
                endDate: end,
                filters,
            });
            setStats(statsData);

            // Get performance metrics
            const perfData = await Meteor.callAsync('reports.getPerformanceMetrics', {
                startDate: start,
                endDate: end,
            });
            setPerformance(perfData);

            // Get SLA report
            const slaData = await Meteor.callAsync('reports.getSLAReport', {
                startDate: start,
                endDate: end,
            });
            setSlaReport(slaData);

            // Get filtered tickets for export
            const ticketData = await Meteor.callAsync('reports.getFilteredTickets', {
                startDate: start,
                endDate: end,
                filters,
                limit: 1000,
                skip: 0,
            });
            setTickets(ticketData.tickets);

        } catch (err) {
            console.error('Error loading report data:', err);
            setError(err.reason || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount and when filters change
    useEffect(() => {
        if (isSupport) {
            loadReportData();
        }
    }, []);

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Handle apply filters
    const handleApplyFilters = () => {
        loadReportData();
    };

    // Handle reset filters
    const handleResetFilters = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        setStartDate(date.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
        setFilters({
            status: 'All',
            category: 'All',
            priority: 'All',
            assignedTo: 'All',
        });
        setTimeout(() => loadReportData(), 100);
    };

    // Handle export to PDF
    const handleExportPDF = () => {
        if (!stats) return;

        exportToPDF(stats, performance, filters, {
            start: new Date(startDate).toLocaleDateString('id-ID'),
            end: new Date(endDate).toLocaleDateString('id-ID'),
        });
    };

    // Handle export to Excel
    const handleExportExcel = () => {
        if (!stats) return;

        exportToExcel(stats, performance, tickets, {
            start: new Date(startDate).toLocaleDateString('id-ID'),
            end: new Date(endDate).toLocaleDateString('id-ID'),
        });
    };

    // Check access
    if (!isSupport) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
                    <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h1>
                    <p className="mt-2 text-gray-600">
                        Analisis komprehensif tiket dan kinerja IT Support
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Akhir
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="All">Semua Status</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="All">Semua Kategori</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Software">Software</option>
                                <option value="Network">Network</option>
                                <option value="Email">Email</option>
                                <option value="Printer">Printer</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prioritas
                            </label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="All">Semua Prioritas</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        {/* IT Support Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IT Support
                            </label>
                            <select
                                value={filters.assignedTo}
                                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="All">Semua IT Support</option>
                                {supportUsers.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.profile?.fullName || user.emails[0].address}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleApplyFilters}
                            disabled={loading}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Memuat...' : 'Terapkan Filter'}
                        </button>
                        <button
                            onClick={handleResetFilters}
                            disabled={loading}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Reset
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tiket</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {stats.totalTickets}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tiket Selesai</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">
                                        {stats.resolvedCount}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {stats.resolvedPercentage}% dari total
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">SLA Terpenuhi</p>
                                    <p className="text-3xl font-bold text-purple-600 mt-2">
                                        {stats.slaMetCount}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {stats.slaPercentage}% compliance
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Rata-rata Waktu</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">
                                        {stats.avgResolutionTime}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">jam penyelesaian</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-full">
                                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Export Buttons */}
                {stats && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ekspor Laporan</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Ekspor ke PDF
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Ekspor ke Excel
                            </button>
                        </div>
                    </div>
                )}

                {/* Charts */}
                {stats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Status Distribution */}
                        {stats.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Distribusi Status
                                </h3>
                                <div style={{ height: '300px' }}>
                                    <Doughnut
                                        data={{
                                            labels: Object.keys(stats.statusBreakdown),
                                            datasets: [{
                                                data: Object.values(stats.statusBreakdown),
                                                backgroundColor: [
                                                    'rgba(59, 130, 246, 0.8)',
                                                    'rgba(251, 146, 60, 0.8)',
                                                    'rgba(251, 191, 36, 0.8)',
                                                    'rgba(16, 185, 129, 0.8)',
                                                    'rgba(107, 114, 128, 0.8)',
                                                    'rgba(239, 68, 68, 0.8)',
                                                ],
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'right' },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Category Distribution */}
                        {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Distribusi Kategori
                                </h3>
                                <div style={{ height: '300px' }}>
                                    <Bar
                                        data={{
                                            labels: Object.keys(stats.categoryBreakdown),
                                            datasets: [{
                                                label: 'Jumlah Tiket',
                                                data: Object.values(stats.categoryBreakdown),
                                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                            }],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                            },
                                            scales: {
                                                y: { beginAtZero: true },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* IT Support Performance Table */}
                {performance && performance.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Kinerja IT Support
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ditugaskan
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Selesai
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aktif
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rata-rata Waktu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            SLA %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {performance.map(p => (
                                        <tr key={p.userId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {p.name}
                                                </div>
                                                <div className="text-sm text-gray-500">{p.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {p.assigned}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {p.resolved}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {p.active}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {p.avgResolutionTime} jam
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${p.slaPercentage >= 90 ? 'bg-green-100 text-green-800' :
                                                        p.slaPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {p.slaPercentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && !stats && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !stats && !error && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih filter dan klik "Terapkan Filter" untuk melihat laporan
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
