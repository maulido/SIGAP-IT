import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tickets } from '../../api/tickets/tickets';
import { Comments } from '../../api/comments/comments';
import { Worklogs } from '../../api/worklogs/worklogs';
import { Attachments } from '../../api/attachments/attachments';
import { PendingReasons } from '../../api/pending-reasons/pending-reasons';
import { Ratings } from '../../api/ratings/ratings';
import { Roles } from '../../api/roles/roles';
import { Escalations } from '../../api/escalations/escalations';
import moment from 'moment';

const EscalationBanner = ({ escalations }) => {
    try {
        if (!escalations || !Array.isArray(escalations) || escalations.length === 0) return null;

        console.log('Rendering EscalationBanner', escalations);

        // Copy and sort
        const sortedEscalations = [...escalations].sort((a, b) => {
            const levelA = a.escalationLevel || 0;
            const levelB = b.escalationLevel || 0;
            return levelB - levelA;
        });

        const activeEscalation = sortedEscalations[0];
        if (!activeEscalation) return null;

        const isCritical = activeEscalation.escalationLevel === 2;

        return (
            <div className={`mb-6 border-l-4 p-4 rounded-r-lg shadow-sm ${isCritical ? 'bg-red-50 border-red-600' : 'bg-orange-50 border-orange-500'
                }`}>
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <span className="text-2xl mr-3">{isCritical ? '🚨' : '⚠️'}</span>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isCritical ? 'text-red-800' : 'text-orange-800'
                            }`}>
                            {isCritical ? 'CRITICAL SLA ESCALATION' : 'SLA Warning'}
                        </h3>
                        <p className={`text-sm ${isCritical ? 'text-red-700' : 'text-orange-700'
                            }`}>
                            This ticket has used <strong>{activeEscalation.percentageUsed}%</strong> of its SLA time.
                            {activeEscalation.escalatedAt && (
                                <span> Escalated {moment(activeEscalation.escalatedAt).fromNow()}.</span>
                            )}
                            {!activeEscalation.acknowledged && (
                                <span className="font-bold ml-1">Requires immediate attention.</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    } catch (err) {
        console.error('Error in EscalationBanner:', err);
        return null;
    }
};

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

export const TicketDetail = () => {
    const { id } = useParams();
    console.log('TicketDetail mounting', { id, Escalations });

    // Safety check for imports
    if (!Escalations) {
        console.error('CRITICAL: Escalations import is undefined');
    }

    const navigate = useNavigate();
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [worklog, setWorklog] = useState('');
    const [reopenReason, setReopenReason] = useState('');

    const [error, setError] = useState('');

    // Admin Assign states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    // Pending workflow states
    const [pendingReasonId, setPendingReasonId] = useState('');
    const [pendingNotes, setPendingNotes] = useState('');
    const [customTimeout, setCustomTimeout] = useState('');

    // Rating states
    const [rating, setRating] = useState(0);
    const [ratingFeedback, setRatingFeedback] = useState('');

    const { ticket, comments, worklogs, attachments, users, currentUser, pendingReasons, ticketRating, ticketFamily, isLoading, escalations } = useTracker(() => {
        try {
            const ticketHandle = Meteor.subscribe('tickets.byId', id);
            const commentsHandle = Meteor.subscribe('comments.byTicket', id);
            const worklogsHandle = Meteor.subscribe('worklogs.byTicket', id);
            const attachmentsHandle = Meteor.subscribe('attachments.byTicket', id);
            const usersHandle = Meteor.subscribe('users.names');
            // If admin, subscribe to active users to get roles for assignment dropdown
            const activeUsersHandle = Meteor.subscribe('users.active');

            const pendingReasonsHandle = Meteor.subscribe('pendingReasons.active');
            const ratingsHandle = Meteor.subscribe('ratings.byTicket', id);
            const familyHandle = Meteor.subscribe('tickets.family', id);
            // Default to empty array if Escalations undefined to prevent crash
            const escalationsHandle = Escalations ? Meteor.subscribe('escalations.byTicket', id) : { ready: () => true };

            const currentUser = Meteor.user();
            const ticket = Tickets.findOne(id);

            const isReady = ticketHandle.ready() &&
                commentsHandle.ready() &&
                worklogsHandle.ready() &&
                attachmentsHandle.ready() &&
                usersHandle.ready() &&
                // activeUsersHandle.ready() && // Optional, can render without full list initially
                pendingReasonsHandle.ready() &&
                ratingsHandle.ready() &&
                familyHandle.ready() &&
                escalationsHandle.ready();

            console.log('TicketDetail tracker state:', {
                id,
                isReady,
                ticketFound: !!ticket,
                userId: currentUser?._id
            });

            // Get family tickets
            let parentTicket = null;
            let childTickets = [];

            if (ticket && familyHandle.ready()) {
                if (ticket.parentTicketId) {
                    parentTicket = Tickets.findOne(ticket.parentTicketId);
                }
                if (ticket.childTicketIds && ticket.childTicketIds.length > 0) {
                    childTickets = Tickets.find({ _id: { $in: ticket.childTicketIds } }).fetch();
                }
            }

            return {
                ticket,
                comments: Comments.find({ ticketId: id }, { sort: { createdAt: 1 } }).fetch(),
                worklogs: Worklogs.find({ ticketId: id }, { sort: { createdAt: 1 } }).fetch(),
                attachments: Attachments.find({ ticketId: id }, { sort: { uploadedAt: 1 } }).fetch(),
                users: Meteor.users.find().fetch(),
                pendingReasons: PendingReasons.find({}, { sort: { reason: 1 } }).fetch(),
                ticketRating: Ratings.findOne({ ticketId: id }),
                ticketFamily: { parent: parentTicket, children: childTickets },
                escalations: Escalations ? Escalations.find({ ticketId: id }).fetch() : [],
                currentUser,
                isLoading: !isReady,
            };
        } catch (err) {
            console.error('Error in TicketDetail useTracker:', err);
            return { isLoading: true };
        }
    });

    // Use currentUser.roles directly instead of Roles.getRolesForUser
    const userRoles = currentUser?.roles || [];

    const isAdmin = userRoles.includes('admin');
    const isSupport = userRoles.includes('support') || isAdmin;
    const isReporter = ticket?.reporterId === currentUser?._id;
    const isAssigned = ticket?.assignedToId === currentUser?._id;

    const getUserName = (userId) => {
        const user = users.find(u => u._id === userId);
        return user?.profile?.fullName || 'Unknown User';
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('comments.add', {
                ticketId: id,
                content: comment,
                isInternal: false,
            });
            setComment('');
        } catch (err) {
            setError(err.reason || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignToSelf = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('tickets.assignToSelf', id);
        } catch (err) {
            setError(err.reason || 'Failed to assign ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminAssign = async (e) => {
        e.preventDefault();
        if (!selectedAssignee) {
            setError('Please select a support agent');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('tickets.assignTo', {
                ticketId: id,
                assigneeId: selectedAssignee
            });
            setShowAssignModal(false);
            setSelectedAssignee('');
        } catch (err) {
            setError(err.reason || 'Failed to assign ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (e) => {
        e.preventDefault();
        if (!worklog.trim() || worklog.length < 10) {
            setError('Worklog must be at least 10 characters');
            return;
        }

        // Validate pending reason if status is Pending
        if (newStatus === 'Pending' && !pendingReasonId) {
            setError('Please select a pending reason');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('tickets.changeStatus', {
                ticketId: id,
                newStatus,
                worklog,
                pendingReasonId: newStatus === 'Pending' ? pendingReasonId : undefined,
                pendingNotes: newStatus === 'Pending' ? pendingNotes : undefined,
                customTimeout: newStatus === 'Pending' && customTimeout ? parseInt(customTimeout) : undefined,
            });
            setShowStatusModal(false);
            setWorklog('');
            setNewStatus('');
            setPendingReasonId('');
            setPendingNotes('');
            setCustomTimeout('');
        } catch (err) {
            setError(err.reason || 'Failed to change status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReopen = async (e) => {
        e.preventDefault();
        if (!reopenReason.trim() || reopenReason.length < 10) {
            setError('Reason must be at least 10 characters');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('tickets.reopen', {
                ticketId: id,
                reason: reopenReason,
            });
            setShowReopenModal(false);
            setReopenReason('');
        } catch (err) {
            setError(err.reason || 'Failed to reopen ticket');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitRating = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await Meteor.callAsync('ratings.submit', {
                ticketId: id,
                rating,
                feedback: ratingFeedback,
            });
            setRating(0);
            setRatingFeedback('');
        } catch (err) {
            setError(err.reason || 'Failed to submit rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = event.target.result;

                await Meteor.callAsync('attachments.upload', {
                    ticketId: id,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    fileData: base64Data,
                });

                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError(err.reason || 'Failed to upload file');
            setIsUploading(false);
        }
    };

    const downloadAttachment = (attachment) => {
        const link = document.createElement('a');
        link.href = attachment.fileData;
        link.download = attachment.fileName;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
                <p className="text-gray-600 mt-2">The ticket you're looking for doesn't exist or you don't have access to it.</p>
                <Link to="/tickets" className="btn-primary mt-4 inline-block">
                    Back to My Tickets
                </Link>
            </div>
        );
    }

    // Merge timeline (comments + worklogs)
    const timeline = [
        ...comments.map(c => ({ ...c, type: 'comment' })),
        ...worklogs.map(w => ({ ...w, type: 'worklog' })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const canReopen = isReporter && ['Resolved', 'Closed'].includes(ticket.status);
    const canAssign = isSupport && ticket.status === 'Open';
    const canChangeStatus = isSupport && isAssigned && ticket.status !== 'Closed';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[ticket.status]}`}>
                            {ticket.status}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
                            {ticket.priority}
                        </span>
                    </div>
                    <h2 className="text-xl text-gray-700">{ticket.title}</h2>
                </div>

                <div className="flex space-x-2">
                    {canAssign && (
                        <button
                            onClick={handleAssignToSelf}
                            disabled={isSubmitting}
                            className="btn-primary"
                        >
                            Assign to Self
                        </button>
                    )}
                    {isAdmin && (ticket.status === 'Open' || ticket.status === 'In Progress') && (
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="btn-primary bg-purple-600 hover:bg-purple-700"
                        >
                            {ticket.assignedToId ? 'Reassign...' : 'Assign To...'}
                        </button>
                    )}
                    {canChangeStatus && (
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className="btn-secondary"
                        >
                            Change Status
                        </button>
                    )}
                    {canReopen && (
                        <button
                            onClick={() => setShowReopenModal(true)}
                            className="btn-secondary"
                        >
                            Reopen Ticket
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Assign To Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Assign Ticket</h3>
                        <form onSubmit={handleAdminAssign}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Support Agent
                                </label>
                                <select
                                    value={selectedAssignee}
                                    onChange={(e) => setSelectedAssignee(e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    <option value="">-- Select --</option>
                                    {users
                                        .filter(u => u.roles && (u.roles.includes('support') || u.roles.includes('admin')) && u._id !== ticket.reporterId)
                                        .map(u => (
                                            <option key={u._id} value={u._id}>
                                                {u.profile?.fullName || u.emails[0].address} ({u.roles.join(', ')})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedAssignee('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary"
                                >
                                    {isSubmitting ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Escalation Banner */}
            <EscalationBanner escalations={ticket?.status !== 'Resolved' && ticket?.status !== 'Closed' ? escalations : []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {attachments && attachments.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                            <div className="space-y-2">
                                {attachments.map(attachment => (
                                    <div key={attachment._id} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium">{attachment.fileName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload File */}
                    {(isReporter || isSupport) && ticket.status !== 'Closed' && (
                        <div className="card">
                            <label className="block">
                                <span className="sr-only">Choose file</span>
                                <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100
                                " />
                            </label>
                            {isUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
                        <div className="space-y-4">
                            {timeline.map((item, index) => (
                                <div key={`${item.type}-${item._id}`} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {item.type === 'comment' ? (
                                            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                        ) : (
                                            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {item.type === 'comment' ? (
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">{getUserName(item.userId || item.authorId)}</span>
                                                    <span className="text-gray-400 text-sm">{moment(item.createdAt).fromNow()}</span>
                                                </div>
                                                <p className="mt-1 text-gray-700">{item.content}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">{getUserName(item.performedBy)}</span>
                                                    <span className="text-gray-500">changed status</span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[item.fromStatus]}`}>
                                                        {item.fromStatus}
                                                    </span>
                                                    <span className="text-gray-500">→</span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[item.toStatus]}`}>
                                                        {item.toStatus}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">{moment(item.createdAt).fromNow()}</span>
                                                </div>
                                                {item.worklog && (
                                                    <p className="mt-1 text-gray-600 text-sm ml-4 border-l-2 border-gray-200 pl-3">
                                                        {item.worklog}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Add Comment */}
                    {(isReporter || isSupport) && ticket.status !== 'Closed' && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Comment</h3>
                            <form onSubmit={handleAddComment}>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="input-field mb-3"
                                    placeholder="Add a comment... (use @username to mention)"
                                    required
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary"
                                    >
                                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Rating Section */}
                    {isReporter && ['Resolved', 'Closed'].includes(ticket.status) && !ticket.hasRating && !ticketRating && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate This Ticket</h3>
                            <p className="text-sm text-gray-600 mb-4">Please rate your experience with this support ticket.</p>
                            <form onSubmit={handleSubmitRating}>
                                <div className="mb-4">
                                    <div className="flex space-x-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <svg className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <textarea
                                        value={ratingFeedback}
                                        onChange={(e) => setRatingFeedback(e.target.value)}
                                        rows={3}
                                        className="input-field"
                                        placeholder="Feedback (Optional)"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Display Rating */}
                    {ticketRating && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Rating</h3>
                            <div className="flex items-center mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`h-5 w-5 ${star <= ticketRating.rating ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-2 text-lg font-semibold text-gray-900">{ticketRating.rating}/5</span>
                            </div>
                            {ticketRating.feedback && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Feedback:</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticketRating.feedback}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                Rated {moment(ticketRating.ratedAt).fromNow()} by {getUserName(ticketRating.ratedBy)}
                            </p>
                        </div>
                    )}
                </div >
                {/* Sidebar */}
                <div className="space-y-6" >
                    {/* Pending Information - Show only when status is Pending */}
                    {
                        ticket.status === 'Pending' && ticket.pendingReason && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                                            ⏸️ Pending Information
                                        </h3>
                                        <div className="text-sm text-yellow-700 space-y-2">
                                            <div>
                                                <p className="font-medium">Reason:</p>
                                                <p>{ticket.pendingReason}</p>
                                            </div>
                                            {ticket.pendingNotes && (
                                                <div>
                                                    <p className="font-medium">Notes:</p>
                                                    <p className="whitespace-pre-wrap">{ticket.pendingNotes}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">Set:</p>
                                                <p>{moment(ticket.pendingSetAt).format('DD MMM YYYY HH:mm')}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium">Expires:</p>
                                                <p>{moment(ticket.pendingTimeout).format('DD MMM YYYY HH:mm')}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium">Time Remaining:</p>
                                                <p className={moment(ticket.pendingTimeout).isBefore(moment()) ? 'text-red-600 font-semibold' : ''}>
                                                    {moment(ticket.pendingTimeout).fromNow()}
                                                    {moment(ticket.pendingTimeout).isBefore(moment()) && ' (EXPIRED)'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-medium">Set by:</p>
                                                <p>{getUserName(ticket.pendingSetBy)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Parent-Child Relationships */}
                    {
                        (ticketFamily?.parent || (ticketFamily?.children && ticketFamily.children.length > 0)) && (
                            <div className="card">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Related Tickets
                                </h3>

                                {/* Parent Ticket */}
                                {ticketFamily.parent && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                            Parent Ticket
                                        </p>
                                        <Link
                                            to={`/tickets/${ticketFamily.parent._id}`}
                                            className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-blue-900">
                                                        {ticketFamily.parent.ticketNumber}
                                                    </p>
                                                    <p className="text-xs text-blue-700 mt-1 line-clamp-2">
                                                        {ticketFamily.parent.title}
                                                    </p>
                                                </div>
                                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${ticketFamily.parent.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                    ticketFamily.parent.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        ticketFamily.parent.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                                                            ticketFamily.parent.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                                ticketFamily.parent.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-red-100 text-red-800'
                                                    }`}>
                                                    {ticketFamily.parent.status}
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                {/* Child Tickets */}
                                {ticketFamily.children && ticketFamily.children.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                            Sub-Tickets ({ticketFamily.children.length})
                                        </p>
                                        <div className="space-y-2">
                                            {ticketFamily.children.map(child => (
                                                <Link
                                                    key={child._id}
                                                    to={`/tickets/${child._id}`}
                                                    className="block bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {child.ticketNumber}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                {child.title}
                                                            </p>
                                                        </div>
                                                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${child.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                            child.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                child.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                                                                    child.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                                        child.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                                                            'bg-red-100 text-red-800'
                                                            }`}>
                                                            {child.status}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* SLA Status */}
                    {
                        ticket.slaStatus && (
                            <div className={`card border-l-4 ${ticket.slaStatus === 'breached' ? 'border-red-500 bg-red-50' :
                                ticket.slaStatus === 'at-risk' ? 'border-yellow-500 bg-yellow-50' :
                                    'border-green-500 bg-green-50'
                                }`}>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    SLA Status
                                </h3>

                                <div className="space-y-3">
                                    {/* Overall Status */}
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${ticket.slaStatus === 'breached' ? 'bg-red-100 text-red-800' :
                                            ticket.slaStatus === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {ticket.slaStatus === 'breached' ? '⚠️ SLA Breached' :
                                                ticket.slaStatus === 'at-risk' ? '⏰ At Risk' :
                                                    '✅ On Track'}
                                        </span>
                                    </div>

                                    {/* Response SLA */}
                                    {!ticket.slaResponseTime && ticket.slaResponseDeadline && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Response Deadline</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {moment(ticket.slaResponseDeadline).format('DD MMM YYYY HH:mm')}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {moment(ticket.slaResponseDeadline).fromNow()}
                                            </p>
                                        </div>
                                    )}

                                    {ticket.slaResponseTime !== undefined && ticket.slaResponseTime !== null && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Response Time</p>
                                            <p className={`text-sm mt-1 font-medium ${ticket.slaResponseMet ? 'text-green-600' : 'text-red-600'}`}>
                                                {Number(ticket.slaResponseTime).toFixed(1)}h
                                                {ticket.slaResponseMet ? ' ✓' : ' ✗'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Resolution SLA */}
                                    {!ticket.slaResolutionTime && ticket.slaResolutionDeadline && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Resolution Deadline</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {moment(ticket.slaResolutionDeadline).format('DD MMM YYYY HH:mm')}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {moment(ticket.slaResolutionDeadline).fromNow()}
                                            </p>
                                        </div>
                                    )}

                                    {ticket.slaResolutionTime !== undefined && ticket.slaResolutionTime !== null && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Resolution Time</p>
                                            <p className={`text-sm mt-1 font-medium ${ticket.slaResolutionMet ? 'text-green-600' : 'text-red-600'}`}>
                                                {Number(ticket.slaResolutionTime).toFixed(1)}h
                                                {ticket.slaResolutionMet ? ' ✓' : ' ✗'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Paused Duration */}
                                    {ticket.slaPausedDuration > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase">Time Paused</p>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {Number(ticket.slaPausedDuration).toFixed(1)}h
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* Dynamic Fields (Metadata) */}
                    {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{ticket.category} Details</h3>
                            <dl className="space-y-3">
                                {Object.entries(ticket.metadata).map(([key, value]) => (
                                    <div key={key}>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Ticket Info */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Information</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Category</dt>
                                <dd className="mt-1 text-sm text-gray-900">{ticket.category}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Location</dt>
                                <dd className="mt-1 text-sm text-gray-900">{ticket.location}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Reporter</dt>
                                <dd className="mt-1 text-sm text-gray-900">{getUserName(ticket.reporterId)}</dd>
                            </div>
                            {ticket.assignedToId && (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase">Assigned To</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{getUserName(ticket.assignedToId)}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">{moment(ticket.createdAt).format('MMM D, YYYY h:mm A')}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{moment(ticket.updatedAt).fromNow()}</dd>
                            </div>
                            {ticket.resolvedAt && (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase">Resolved</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{moment(ticket.resolvedAt).format('MMM D, YYYY h:mm A')}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div >
            </div >

            {/* Status Change Modal */}
            {
                showStatusModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Ticket Status</h3>
                            <form onSubmit={handleStatusChange}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select status...</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Worklog (required, min 10 characters)
                                    </label>
                                    <textarea
                                        value={worklog}
                                        onChange={(e) => setWorklog(e.target.value)}
                                        rows={4}
                                        className="input-field"
                                        placeholder="Describe what you did..."
                                        required
                                    />
                                </div>

                                {/* Pending Reason Fields - Show only when status is Pending */}
                                {newStatus === 'Pending' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pending Reason <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={pendingReasonId}
                                                onChange={(e) => setPendingReasonId(e.target.value)}
                                                className="input-field"
                                                required
                                            >
                                                <option value="">Select a reason...</option>
                                                {pendingReasons.map(reason => (
                                                    <option key={reason._id} value={reason._id}>
                                                        {reason.reason} ({reason.defaultTimeout}h)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Additional Notes (Optional)
                                            </label>
                                            <textarea
                                                value={pendingNotes}
                                                onChange={(e) => setPendingNotes(e.target.value)}
                                                rows={3}
                                                className="input-field"
                                                placeholder="Any additional information about why this ticket is pending..."
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Custom Timeout (hours)
                                            </label>
                                            <input
                                                type="number"
                                                value={customTimeout}
                                                onChange={(e) => setCustomTimeout(e.target.value)}
                                                className="input-field"
                                                min="1"
                                                max="168"
                                                placeholder="Leave empty to use default"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Maximum 168 hours (1 week). Leave empty to use the default timeout from the selected reason.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            setWorklog('');
                                            setNewStatus('');
                                            setPendingReasonId('');
                                            setPendingNotes('');
                                            setCustomTimeout('');
                                            setError('');
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary"
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Status'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Reopen Modal */}
            {
                showReopenModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reopen Ticket</h3>
                            <form onSubmit={handleReopen}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Reopening (min 10 characters)
                                    </label>
                                    <textarea
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        rows={4}
                                        className="input-field"
                                        placeholder="Why are you reopening this ticket?"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReopenModal(false);
                                            setReopenReason('');
                                            setError('');
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn-primary"
                                    >
                                        {isSubmitting ? 'Reopening...' : 'Reopen Ticket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
