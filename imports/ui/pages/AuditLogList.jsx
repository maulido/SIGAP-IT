import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { AuditLogs } from '../../api/audit-logs/audit-logs';
import { Shield, Search, Filter, Calendar, ChevronLeft, ChevronRight, User, Eye } from 'lucide-react';

export const AuditLogList = () => {
    const [page, setPage] = useState(1);
    const [pageLimit] = useState(20);
    const [totalDocs, setTotalDocs] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({
        action: 'All',
        userId: 'All',
        startDate: '',
        endDate: '',
    });

    // Subscribe to Audit Logs
    const { logs, isLoading, currentUser, isAdmin } = useTracker(() => {
        const handle = Meteor.subscribe('auditLogs.paginated', {
            page,
            limit: pageLimit,
            filters
        });

        const user = Meteor.user();
        return {
            logs: AuditLogs.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready(),
            currentUser: user,
            isAdmin: user?.roles?.includes('admin'),
        };
    }, [page, filters, pageLimit]);

    // Fetch total count for pagination
    useEffect(() => {
        Meteor.call('auditLogs.getCount', { filters }, (err, count) => {
            if (!err) {
                setTotalDocs(count);
            }
        });
    }, [filters]);

    // Get Support/Admin Users for Filter
    const { users } = useTracker(() => {
        Meteor.subscribe('users.all'); // Assumes this existing pub or generic user pub
        return {
            users: Meteor.users.find({}, { sort: { 'profile.fullName': 1 } }).fetch()
        };
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page
    };

    const handleResetFilters = () => {
        setFilters({
            action: 'All',
            userId: 'All',
            startDate: '',
            endDate: '',
        });
        setPage(1);
    };

    // Calculate pagination info
    const totalPages = Math.ceil(totalDocs / pageLimit);
    const startEntry = (page - 1) * pageLimit + 1;
    const endEntry = Math.min(page * pageLimit, totalDocs);

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="text-gray-600 mt-2">You do not have permission to view audit logs.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-indigo-600" />
                            Audit Log System
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Track and monitor all system activities and security events.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>

                            {/* Action Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                                <select
                                    className="input-field"
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                >
                                    <option value="All">All Actions</option>
                                    <option value="ticket_created">Ticket Created</option>
                                    <option value="ticket_assigned">Ticket Assigned</option>
                                    <option value="status_changed">Status Changed</option>
                                    <option value="ticket_reopened">Ticket Reopened</option>
                                    <option value="login">User Login</option>
                                    <option value="logout">User Logout</option>
                                </select>
                            </div>

                            {/* User Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                                <select
                                    className="input-field"
                                    value={filters.userId}
                                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                                >
                                    <option value="All">All Users</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.profile?.fullName || u.username || u.emails?.[0]?.address}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleResetFilters}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No audit logs found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        // Find user details manually if not populated in backend
                                        const actor = users.find(u => u._id === log.userId);
                                        const actorName = actor?.profile?.fullName || actor?.emails?.[0]?.address || 'Unknown User';

                                        return (
                                            <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="h-4 w-4 text-gray-500" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900">{actorName}</p>
                                                            <p className="text-xs text-gray-500">{log.userId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${log.action.includes('error') ? 'bg-red-100 text-red-800' :
                                                            log.action.includes('delete') ? 'bg-red-100 text-red-800' :
                                                                log.action.includes('create') ? 'bg-green-100 text-green-800' :
                                                                    'bg-blue-100 text-blue-800'}`}>
                                                        {log.action.replace(/_/g, ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {log.entityType || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {log.metadata ? (
                                                        <code className="text-xs bg-gray-100 p-1 rounded">
                                                            {JSON.stringify(log.metadata)}
                                                        </code>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startEntry}</span> to <span className="font-medium">{endEntry}</span> of{' '}
                                    <span className="font-medium">{totalDocs}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
