import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Announcements } from '../../api/announcements/announcements';

export const AnnouncementBanner = () => {
    const { announcements, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('announcements.active');
        return {
            announcements: Announcements.find({}, { sort: { startAt: -1 } }).fetch(),
            isLoading: !handle.ready()
        };
    });

    const [dismissedIds, setDismissedIds] = useState([]);

    if (isLoading || announcements.length === 0) return null;

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(a => !dismissedIds.includes(a._id));

    if (visibleAnnouncements.length === 0) return null;

    const getColors = (type) => {
        switch (type) {
            case 'critical': return 'bg-red-600 text-white';
            case 'warning': return 'bg-yellow-500 text-white';
            case 'info':
            default: return 'bg-blue-600 text-white';
        }
    };

    const handleDismiss = (id) => {
        setDismissedIds(prev => [...prev, id]);
    };

    return (
        <div className="space-y-1 mb-4">
            {visibleAnnouncements.map(announcement => (
                <div
                    key={announcement._id}
                    className={`${getColors(announcement.type)} px-4 py-3 shadow-sm relative`}
                >
                    <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center flex-1">
                            <span className="flex p-2 rounded-lg bg-black bg-opacity-20">
                                {announcement.type === 'critical' && (
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {announcement.type === 'warning' && (
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {announcement.type === 'info' && (
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </span>
                            <div className="ml-3 font-medium truncate">
                                <span className="md:hidden">{announcement.title}</span>
                                <span className="hidden md:inline">
                                    <span className="font-bold">{announcement.title}: </span>
                                    {announcement.message}
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 order-2 sm:order-3 sm:ml-3">
                            <button
                                type="button"
                                onClick={() => handleDismiss(announcement._id)}
                                className="-mr-1 flex p-2 rounded-md hover:bg-black hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
