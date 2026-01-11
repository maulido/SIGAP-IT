import React, { useState, useRef, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Notifications } from '../../api/notifications/notifications';
import { Bell, CheckDouble, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';

export const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const { notifications, unreadCount, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('notifications.myNotifications', 5);
        // We can create a separate sub/counter or just use the find count from the limited sub + assumption? 
        // Or publish a counter separately.
        // For simplicity, let's just subscribe to recent ones and rely on the client side count of unread items within that limit OR subscribe to a dedicated counter.
        // Let's create a dedicated counter subscription later if needed. For now, we only show badge if we have unread items in the recent list OR we can fetch a count.

        // Actually, let's modify the publication later to be more robust.
        // For now, assume 'notifications.myNotifications' gives us what we need.
        const notifs = Notifications.find({}, { sort: { createdAt: -1 } }).fetch();
        const unread = Notifications.find({ isRead: false }).count();

        return {
            notifications: notifs,
            unreadCount: unread,
            isLoading: !handle.ready()
        };
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkAsRead = async (id, link) => {
        try {
            await Meteor.callAsync('notifications.markAsRead', id);
            if (link) {
                setIsOpen(false);
                navigate(link);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await Meteor.callAsync('notifications.markAllAsRead');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none relative"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => handleMarkAsRead(notification._id, notification.link)}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 break-words mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {moment(notification.createdAt).fromNow()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="ml-2 flex-shrink-0">
                                                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center">
                        <Link
                            to="/notifications"
                            className="text-xs font-medium text-primary-600 hover:text-primary-800 block w-full h-full"
                            onClick={() => setIsOpen(false)}
                        >
                            View All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};
