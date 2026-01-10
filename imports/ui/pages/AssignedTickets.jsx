import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Link } from 'react-router-dom';
import { Tickets } from '../../api/tickets/tickets';
import { Roles } from '../../api/roles/roles';
import moment from 'moment';

const STATUS_COLORS = {
    'Open': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
    'Low': 'bg-gray-100 text-gray-800',
    'Medium': 'bg-blue-100 text-blue-800',
    'High': 'bg-orange-100 text-orange-800',
    'Critical': 'bg-red-100 text-red-800',
};

export const AssignedTickets = () => {
    const [statusFilter, setStatusFilter] = useState('');

    const { tickets, isLoading, userRoles } = useTracker(() => {
        const handle = Meteor.subscribe('tickets.assigned');
        const currentUser = Meteor.user();
        const userRoles = currentUser ? Roles.getRolesForUser(currentUser._id) : [];

        return {
            tickets: Tickets.find(
                { assignedToId: currentUser?._id },
                { sort: { updatedAt: -1 } }
            ).fetch(),
            isLoading: !handle.ready(),
            userRoles,
        };
    });

    const isSupport = userRoles.includes('support') || userRoles.includes('admin');

    if (!isSupport) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
                <p className="text-gray-600 mt-2">Only IT Support can access this page.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Apply status filter
    const filteredTickets = statusFilter
        ? tickets.filter(ticket => ticket.status === statusFilter)
        : tickets;

    // Group by status
    const ticketsByStatus = {
        'In Progress': filteredTickets.filter(t => t.status === 'In Progress'),
        'Pending': filteredTickets.filter(t => t.status === 'Pending'),
        'Resolved': filteredTickets.filter(t => t.status === 'Resolved'),
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">My Assigned Tickets</h1>
                <p className="text-gray-600 mt-1">{filteredTickets.length} ticket(s) assigned to you</p>
            </div>

            {/* Status Filter */}
            <div className="card mb-6">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === ''
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All ({tickets.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('In Progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'In Progress'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        In Progress ({ticketsByStatus['In Progress'].length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('Pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'Pending'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pending ({ticketsByStatus['Pending'].length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('Resolved')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'Resolved'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Resolved ({ticketsByStatus['Resolved'].length})
                    </button>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned tickets</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {statusFilter
                            ? `You have no tickets with status "${statusFilter}".`
                            : 'You have no assigned tickets. Check the Open Tickets page to pick up new work.'}
                    </p>
                    {!statusFilter && (
                        <div className="mt-6">
                            <Link to="/tickets/open" className="btn-primary">
                                View Open Tickets
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTickets.map(ticket => (
                        <Link
                            key={ticket._id}
                            to={`/tickets/${ticket._id}`}
                            className="card hover:shadow-lg transition-shadow block"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="font-mono text-sm font-medium text-gray-900">
                                            {ticket.ticketNumber}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[ticket.status]}`}>
                                            {ticket.status}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {ticket.title}
                                    </h3>

                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                        {ticket.description}
                                    </p>

                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span className="flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            {ticket.category}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {ticket.location}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Updated {moment(ticket.updatedAt).fromNow()}
                                        </span>
                                    </div>
                                </div>

                                <div className="ml-4">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
