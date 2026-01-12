import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Link } from 'react-router-dom';
import { Tickets } from '../../api/tickets/tickets';
import { Roles } from '../../api/roles/roles';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Trash2, CheckCircle, UserPlus, X } from 'lucide-react';
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

export const AllTickets = () => {
    const [filter, setFilter] = useState({ category: '', priority: '', location: '', status: '' });
    // Bulk Action State
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkActionType, setBulkActionType] = useState(''); // 'delete', 'status', 'assign'

    const { tickets, isLoading, userRoles, users } = useTracker(() => {
        const query = {};
        if (filter.status) query.status = filter.status;
        if (filter.priority) query.priority = filter.priority;
        if (filter.category) query.category = filter.category;

        const handle = Meteor.subscribe('tickets.all', filter);
        const usersHandle = Meteor.subscribe('users.names');
        const currentUser = Meteor.user();
        const userRoles = currentUser ? Roles.getRolesForUser(currentUser._id) : [];

        // Client-side filtering as well to ensure responsiveness if publication returns extra
        // But mainly relying on publication for efficiency if implemented there.
        // The publication takes filters but let's query purely on client for simplified reactiveness 
        // if the publication just dumps active tickets.
        // Actually, existing 'tickets.all' uses arguments. passing filter state to subscribe.

        return {
            tickets: Tickets.find({}, { sort: { createdAt: -1 } }).fetch(),
            users: Meteor.users.find().fetch(),
            isLoading: !handle.ready() || !usersHandle.ready(),
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

    // Apply strict client-side filtering to match UI state
    const filteredTickets = tickets.filter(ticket => {
        if (filter.category && ticket.category !== filter.category) return false;
        if (filter.priority && ticket.priority !== filter.priority) return false;
        if (filter.status && ticket.status !== filter.status) return false;
        if (filter.location && !ticket.location.toLowerCase().includes(filter.location.toLowerCase())) return false;
        return true;
    });

    const categories = [...new Set(tickets.map(t => t.category))];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const statuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Rejected'];

    const getUserName = (userId) => {
        if (!userId) return 'Unassigned';
        const user = users.find(u => u._id === userId);
        return user?.profile?.fullName || 'Unknown User';
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedTickets(new Set(filteredTickets.map(t => t._id)));
        } else {
            setSelectedTickets(new Set());
        }
    };

    const handleSelectTicket = (id) => {
        const newSelected = new Set(selectedTickets);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTickets(newSelected);
    };

    const handleBulkDelete = async () => {
        setIsProcessing(true);
        try {
            const ticketIds = Array.from(selectedTickets);
            await Meteor.callAsync('tickets.bulkAction', {
                ticketIds,
                action: 'delete'
            });
            setIsBulkDeleteModalOpen(false);
            setSelectedTickets(new Set());
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkStatus = async (newStatus) => {
        if (!confirm(`Set ${selectedTickets.size} tickets to ${newStatus}?`)) return;
        setIsProcessing(true);
        try {
            const ticketIds = Array.from(selectedTickets);
            await Meteor.callAsync('tickets.bulkAction', {
                ticketIds,
                action: 'updateStatus',
                data: { status: newStatus }
            });
            setSelectedTickets(new Set());
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkAssignSelf = async () => {
        setIsProcessing(true);
        try {
            const ticketIds = Array.from(selectedTickets);
            const currentUser = Meteor.user();
            await Meteor.callAsync('tickets.bulkAction', {
                ticketIds,
                action: 'assign',
                data: { assigneeId: currentUser._id }
            });
            setSelectedTickets(new Set());
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">All Tickets Monitoring</h1>
                <p className="text-gray-600 mt-1">Monitor all ticket activities across the system</p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className="input-field"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={filter.category}
                            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                            className="input-field"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                            value={filter.priority}
                            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                            className="input-field"
                        >
                            <option value="">All Priorities</option>
                            {priorities.map(pri => (
                                <option key={pri} value={pri}>{pri}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                            type="text"
                            value={filter.location}
                            onChange={(e) => setFilter({ ...filter, location: e.target.value })}
                            placeholder="Search location..."
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="card text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                    <p className="mt-1 text-sm text-gray-500">There are no tickets matching your filters.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        checked={filteredTickets.length > 0 && selectedTickets.size === filteredTickets.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assigned To
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket._id} className={selectedTickets.has(ticket._id) ? "bg-blue-50" : "hover:bg-gray-50"}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={selectedTickets.has(ticket._id)}
                                            onChange={() => handleSelectTicket(ticket._id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <Link to={`/tickets/${ticket._id}`} className="text-sm font-medium text-primary-600 hover:text-primary-900">
                                                {ticket.ticketNumber}
                                            </Link>
                                            <span className="text-xs text-gray-500 line-clamp-1 max-w-xs">{ticket.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${STATUS_COLORS[ticket.status]}`}>
                                                {ticket.status}
                                            </span>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${PRIORITY_COLORS[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {getUserName(ticket.assignedToId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{ticket.category}</div>
                                        <div className="text-xs text-gray-500">{ticket.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {moment(ticket.createdAt).fromNow()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedTickets.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center space-x-4 animate-slideUp z-50">
                    <span className="text-sm font-medium text-gray-700 border-r border-gray-200 pr-4">
                        {selectedTickets.size} selected
                    </span>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleBulkAssignSelf}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full tooltip"
                            title="Assign to Me"
                        >
                            <UserPlus size={20} />
                        </button>

                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        <button
                            onClick={() => handleBulkStatus('Resolved')}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full"
                            title="Mark Resolved"
                        >
                            <CheckCircle size={20} />
                        </button>

                        {/* More dropdown could go here */}

                        {userRoles.includes('admin') && (
                            <>
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                                <button
                                    onClick={() => setIsBulkDeleteModalOpen(true)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    title="Delete Selected"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </>
                        )}

                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        <button
                            onClick={() => setSelectedTickets(new Set())}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title={`Delete ${selectedTickets.size} Tickets`}
                message={`Are you sure you want to delete ${selectedTickets.size} tickets? This action cannot be undone.`}
                isDeleting={isProcessing}
            />
        </div>
    );
};
