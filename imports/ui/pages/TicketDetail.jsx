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

export const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [worklog, setWorklog] = useState('');
    const [reopenReason, setReopenReason] = useState('');
    const [error, setError] = useState('');

    // Pending workflow states
    const [pendingReasonId, setPendingReasonId] = useState('');
    const [pendingNotes, setPendingNotes] = useState('');
    const [customTimeout, setCustomTimeout] = useState('');

    // Rating states
    const [rating, setRating] = useState(0);
    const [ratingFeedback, setRatingFeedback] = useState('');

    const { ticket, comments, worklogs, attachments, users, currentUser, pendingReasons, ticketRating, isLoading } = useTracker(() => {
        const ticketHandle = Meteor.subscribe('tickets.byId', id);
        const commentsHandle = Meteor.subscribe('comments.byTicket', id);
        const worklogsHandle = Meteor.subscribe('worklogs.byTicket', id);
        const attachmentsHandle = Meteor.subscribe('attachments.byTicket', id);
        const usersHandle = Meteor.subscribe('users.names');
        const pendingReasonsHandle = Meteor.subscribe('pendingReasons.active');
        const ratingsHandle = Meteor.subscribe('ratings.byTicket', id);

        const currentUser = Meteor.user();
        const ticket = Tickets.findOne(id);
        const isLoading = !ticketHandle.ready() || !commentsHandle.ready() || !worklogsHandle.ready() || !attachmentsHandle.ready() || !usersHandle.ready() || !pendingReasonsHandle.ready() || !ratingsHandle.ready();

        return {
            ticket,
            comments: Comments.find({ ticketId: id }, { sort: { createdAt: 1 } }).fetch(),
            worklogs: Worklogs.find({ ticketId: id }, { sort: { createdAt: 1 } }).fetch(),
            attachments: Attachments.find({ ticketId: id }, { sort: { uploadedAt: 1 } }).fetch(),
            users: Meteor.users.find().fetch(),
            pendingReasons: PendingReasons.find({}, { sort: { reason: 1 } }).fetch(),
            ticketRating: Ratings.findOne({ ticketId: id }),
            currentUser,
            isLoading,
        };
    });

    // Use currentUser.roles directly instead of Roles.getRolesForUser
    const userRoles = currentUser?.roles || [];

    const isSupport = userRoles.includes('support') || userRoles.includes('admin');
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

        setIsSubmitting(true);
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

                setIsSubmitting(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError(err.reason || 'Failed to upload file');
            setIsSubmitting(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                            <div className="space-y-2">
                                {attachments.map(attachment => (
                                    <div
                                        key={attachment._id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(attachment.fileSize / 1024).toFixed(2)} KB • Uploaded by {getUserName(attachment.uploadedBy)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => downloadAttachment(attachment)}
                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                        >
                                            Download
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload File */}
                    {(isReporter || isSupport) && ticket.status !== 'Closed' && (
                        <div className="card">
                            <label className="block">
                                <span className="text-sm font-medium text-gray-700">Add Attachment</span>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={isSubmitting}
                                    className="mt-1 block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-primary-50 file:text-primary-700
                                        hover:file:bg-primary-100
                                        disabled:opacity-50"
                                />
                            </label>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
                        <div className="space-y-4">
                            {timeline.map((item, index) => (
                                <div key={`${item.type}-${item._id}`} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        {item.type === 'comment' ? (
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {getUserName(item.userId)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {moment(item.createdAt).format('MMM D, YYYY h:mm A')}
                                            </p>
                                        </div>
                                        {item.type === 'comment' ? (
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                                        ) : (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">
                                                    Status changed: <span className="font-medium">{item.fromStatus}</span> → <span className="font-medium">{item.toStatus}</span>
                                                </p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.worklog}</p>
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
                                    rows={4}
                                    className="input-field"
                                    placeholder="Type your comment here..."
                                    disabled={isSubmitting}
                                />
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !comment.trim()}
                                        className="btn-primary"
                                    >
                                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Rating Section - Show for reporter on Resolved/Closed tickets without rating */}
                    {isReporter && ['Resolved', 'Closed'].includes(ticket.status) && !ticket.hasRating && !ticketRating && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate This Ticket</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                How satisfied are you with the resolution of this ticket?
                            </p>

                            <form onSubmit={handleSubmitRating}>
                                {/* Star Rating */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <svg
                                                    className={`h-8 w-8 ${star <= rating
                                                            ? 'text-yellow-400 fill-current'
                                                            : 'text-gray-300'
                                                        }`}
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600">
                                            {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
                                        </span>
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Feedback (Optional)
                                    </label>
                                    <textarea
                                        value={ratingFeedback}
                                        onChange={(e) => setRatingFeedback(e.target.value)}
                                        rows={4}
                                        className="input-field"
                                        placeholder="Share your experience or suggestions for improvement..."
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || rating === 0}
                                        className="btn-primary"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Display Rating - Show if ticket has rating */}
                    {ticketRating && (
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Rating</h3>
                            <div className="flex items-center mb-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <svg
                                        key={star}
                                        className={`h-6 w-6 ${star <= ticketRating.rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                            }`}
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                                <span className="ml-2 text-lg font-semibold text-gray-900">
                                    {ticketRating.rating}/5
                                </span>
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
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Pending Information - Show only when status is Pending */}
                    {ticket.status === 'Pending' && ticket.pendingReason && (
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
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
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
            )}

            {/* Reopen Modal */}
            {showReopenModal && (
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
            )}
        </div>
    );
};
