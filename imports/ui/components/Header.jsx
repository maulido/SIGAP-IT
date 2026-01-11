import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Menu, Bell, User, LogOut } from 'lucide-react';

export const Header = ({ onMenuClick }) => {
    const user = useTracker(() => Meteor.user());

    const handleLogout = () => {
        Meteor.logout((err) => {
            if (err) console.error('Logout error:', err);
        });
    };

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 lg:px-6">
                {/* Left: Mobile Menu & Brand */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Brand visible on all screens now that Sidebar header is gone */}
                    <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        SIGAP-IT
                    </div>
                </div>

                {/* Right: Actions & User */}
                <div className="flex items-center gap-4">
                    {/* Notifications (Placeholder) */}
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-semibold text-gray-800">
                                {user?.profile?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                                {user?.roles?.[0] || 'Member'}
                            </p>
                        </div>

                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-sm">
                            {user?.profile?.fullName?.charAt(0) || <User size={16} />}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
