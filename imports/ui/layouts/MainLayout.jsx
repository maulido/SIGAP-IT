import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Roles } from '../../api/roles/roles';

export const MainLayout = () => {
    const navigate = useNavigate();

    const { user, userId } = useTracker(() => {
        return {
            user: Meteor.user(),
            userId: Meteor.userId(),
        };
    }, []);

    const handleLogout = () => {
        Meteor.logout(() => {
            navigate('/login');
        });
    };

    const isAdmin = user && Roles.userIsInRole(user, ['admin']);
    const isSupport = user && Roles.userIsInRole(user, ['support', 'admin']);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo & Brand */}
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center">
                                <div className="flex-shrink-0 flex items-center">
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        SIGAP-IT
                                    </h1>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/dashboard"
                                className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/tickets"
                                className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                            >
                                My Tickets
                            </Link>
                            <Link
                                to="/tickets/create"
                                className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                            >
                                Create Ticket
                            </Link>
                            <Link
                                to="/kb"
                                className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                            >
                                Knowledge Base
                            </Link>
                            {isSupport && (
                                <>
                                    <Link
                                        to="/tickets/open"
                                        className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                    >
                                        Open Tickets
                                    </Link>
                                    <Link
                                        to="/tickets/assigned"
                                        className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                    >
                                        Assigned to Me
                                    </Link>
                                </>
                            )}
                            {isAdmin && (
                                <Link
                                    to="/users"
                                    className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                >
                                    Users
                                </Link>
                            )}
                            {isSupport && (
                                <Link
                                    to="/reports"
                                    className="border-transparent text-gray-900 hover:border-purple-500 hover:text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                >
                                    Reports
                                </Link>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm">
                                    <p className="text-gray-900 font-medium">
                                        {user?.profile?.fullName || user?.emails?.[0]?.address || 'User'}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {user?.roles?.[0] || 'User'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
};
