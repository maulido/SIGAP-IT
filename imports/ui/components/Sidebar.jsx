import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Roles } from '../../api/roles/roles';
import {
    LayoutDashboard,
    Ticket,
    Plus,
    BookOpen,
    FolderOpen,
    UserCheck,
    Users,
    BarChart3,
    LogOut,
    X,
    Menu
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { user, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('users.current');
        return {
            user: Meteor.user(),
            isLoading: !handle.ready(),
        };
    }, []);

    const handleLogout = () => {
        Meteor.logout(() => {
            navigate('/login');
        });
    };

    // Check roles directly from user object
    const isAdmin = user && user.roles && user.roles.includes('admin');
    const isSupport = user && user.roles && (user.roles.includes('support') || user.roles.includes('admin'));

    // Debug logging
    if (user) {
        console.log('[Sidebar] User data:', {
            email: user.emails?.[0]?.address,
            roles: user.roles,
            isAdmin,
            isSupport
        });
    }


    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
            roles: ['user', 'support', 'admin']
        },
        {
            name: 'My Tickets',
            path: '/tickets',
            icon: Ticket,
            roles: ['user', 'support', 'admin']
        },
        {
            name: 'Create Ticket',
            path: '/tickets/create',
            icon: Plus,
            roles: ['user', 'support', 'admin']
        },
        {
            name: 'Knowledge Base',
            path: '/kb',
            icon: BookOpen,
            roles: ['user', 'support', 'admin']
        },
        {
            name: 'Open Tickets',
            path: '/tickets/open',
            icon: FolderOpen,
            roles: ['support', 'admin'],
            divider: true
        },
        {
            name: 'Assigned to Me',
            path: '/tickets/assigned',
            icon: UserCheck,
            roles: ['support', 'admin']
        },
        {
            name: 'Reports',
            path: '/reports',
            icon: BarChart3,
            roles: ['support', 'admin']
        },
        {
            name: 'User Management',
            path: '/admin/users',
            icon: Users,
            roles: ['admin'],
            divider: true
        }
    ];

    const visibleMenuItems = menuItems.filter(item => {
        if (isAdmin) return item.roles.includes('admin');
        if (isSupport) return item.roles.includes('support');
        return item.roles.includes('user');
    });

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <Link to="/dashboard" className="flex items-center" onClick={onClose}>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            SIGAP-IT
                        </h1>
                    </Link>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {visibleMenuItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <React.Fragment key={item.path}>
                                {item.divider && index > 0 && (
                                    <div className="my-2 border-t border-gray-200" />
                                )}
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={`
                                        flex items-center space-x-3 px-4 py-3 rounded-lg
                                        transition-all duration-200
                                        ${active
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="border-t border-gray-200 p-4">
                    <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.profile?.fullName || user?.emails?.[0]?.address || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {(user?.roles?.[0] || 'user').charAt(0).toUpperCase() + (user?.roles?.[0] || 'user').slice(1)}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
