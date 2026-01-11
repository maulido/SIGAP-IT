import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Link } from 'react-router-dom';
import { Roles } from '../../api/roles/roles';
import { Tickets } from '../../api/tickets/tickets';
import {
    TicketTrendsChart,
    SLAComplianceChart,
    CategoryDistributionChart,
    PriorityBreakdownChart,
    StatusDistributionChart,
} from '../components/DashboardCharts';
import { EscalationMonitor } from '../components/EscalationMonitor';

export const Dashboard = () => {
    const { user, userRoles, stats, isLoading } = useTracker(() => {
        const user = Meteor.user();
        const userRoles = user ? Roles.getRolesForUser(user._id) : [];
        const isAdmin = userRoles.includes('admin');
        const isSupport = userRoles.includes('support') || isAdmin;

        // Subscribe to necessary data
        Meteor.subscribe('tickets.myTickets');
        if (isSupport) {
            Meteor.subscribe('tickets.assigned');
            Meteor.subscribe('tickets.open');
        }

        const stats = {
            myTickets: Tickets.find({ reporterId: user?._id }).count(),
            myOpen: Tickets.find({ reporterId: user?._id, status: 'Open' }).count(),
            myInProgress: Tickets.find({ reporterId: user?._id, status: 'In Progress' }).count(),
            myResolved: Tickets.find({ reporterId: user?._id, status: 'Resolved' }).count(),
        };

        if (isSupport) {
            stats.assignedToMe = Tickets.find({ assignedToId: user?._id }).count();
            stats.openTickets = Tickets.find({ status: 'Open' }).count();
            stats.myActiveTickets = Tickets.find({
                assignedToId: user?._id,
                status: 'In Progress'
            }).count();
        }

        return {
            user,
            userRoles,
            stats,
            isLoading: !user,
        };
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const isAdmin = userRoles.includes('admin');
    const isSupport = userRoles.includes('support') || isAdmin;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Welcome back, {user.profile?.fullName || 'User'}!
                </p>
            </div>

            {/* SLA Escalation Monitor (Only visible to Support/Admin) */}
            {isSupport && <EscalationMonitor />}

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/tickets/create"
                        className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">Create New Ticket</p>
                                <p className="text-xs text-gray-500">Report a new issue</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/tickets"
                        className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
                    >
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">View My Tickets</p>
                                <p className="text-xs text-gray-500">Track your requests</p>
                            </div>
                        </div>
                    </Link>

                    {isSupport && (
                        <Link
                            to="/tickets/open"
                            className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
                        >
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Open Tickets</p>
                                    <p className="text-xs text-gray-500">Pick up new tickets</p>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                        <p className="text-sm font-medium text-blue-900">My Tickets</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{stats.myTickets}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
                        <p className="text-sm font-medium text-yellow-900">Open</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.myOpen}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                        <p className="text-sm font-medium text-purple-900">In Progress</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">{stats.myInProgress}</p>
                    </div>

                    <div className="card bg-gradient-to-br from-green-50 to-green-100">
                        <p className="text-sm font-medium text-green-900">Resolved</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">{stats.myResolved}</p>
                    </div>

                    {isSupport && (
                        <>
                            <div className="card bg-gradient-to-br from-red-50 to-red-100">
                                <p className="text-sm font-medium text-red-900">Available Tickets</p>
                                <p className="text-3xl font-bold text-red-600 mt-2">{stats.openTickets}</p>
                            </div>

                            <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
                                <p className="text-sm font-medium text-indigo-900">Assigned to Me</p>
                                <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.assignedToMe}</p>
                            </div>

                            <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
                                <p className="text-sm font-medium text-pink-900">My Active Tickets</p>
                                <p className="text-3xl font-bold text-pink-600 mt-2">{stats.myActiveTickets}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>

                {/* Ticket Trends */}
                <div className="card mb-6">
                    <TicketTrendsChart days={30} />
                </div>

                {/* Other Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isSupport && (
                        <div className="card">
                            <SLAComplianceChart />
                        </div>
                    )}

                    <div className="card">
                        <CategoryDistributionChart />
                    </div>

                    <div className="card">
                        <PriorityBreakdownChart />
                    </div>

                    <div className="card">
                        <StatusDistributionChart />
                    </div>
                </div>
            </div>
        </div>
    );
};
