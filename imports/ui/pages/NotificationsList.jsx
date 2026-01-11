import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Notifications } from '../../api/notifications/notifications';
import { Trash2, CheckCircle } from 'lucide-react';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export const NotificationsList = () => {
    const navigate = useNavigate();

    // Subscribe to a larger limit for the full list page
    const { notifications, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('notifications.myNotifications', 50);
        return {
            notifications: Notifications.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready()
        };
    });

    const handleMarkAsRead = async (id, link) => {
        try {
            await Meteor.callAsync('notifications.markAsRead', id);
            if (link) {
                navigate(link);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!confirm('Mark all notifications as read?')) return;
        try {
            await Meteor.callAsync('notifications.markAllAsRead');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
        try {
            await Meteor.callAsync('notifications.clearAll');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-1">Manage your alerts and messages</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleMarkAllAsRead}
                        className="btn-secondary flex items-center"
                        disabled={notifications.length === 0}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark all read
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="btn-danger flex items-center"
                        disabled={notifications.length === 0}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear all
                    </button>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-600 mt-2">You have no notifications at the moment.</p>
                </div>
            ) : (
                <div className="card divide-y divide-gray-200">
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`p-4 hover:bg-gray-50 transition-colors flex items-start group ${!notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''
                                }`}
                        >
                            <div className="flex-1 cursor-pointer" onClick={() => handleMarkAsRead(notification._id, notification.link)}>
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className={`text-base font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {moment(notification.createdAt).fromNow()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    {notification.message}
                                </p>
                                {notification.link && (
                                    <span className="text-xs font-medium text-primary-600 group-hover:underline">
                                        View Details &rarr;
                                    </span>
                                )}
                            </div>

                            {!notification.isRead && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification._id);
                                    }}
                                    className="ml-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                    title="Mark as read"
                                >
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
