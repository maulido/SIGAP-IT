import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
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
    ChevronLeft,
    ChevronRight,
    Monitor,
    Shield
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useTracker(() => {
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
            name: 'Monitor Tickets',
            path: '/tickets/all',
            icon: Monitor,
            roles: ['support', 'admin'],
            divider: true
        },
        {
            name: 'Open Tickets',
            path: '/tickets/open',
            icon: FolderOpen,
            roles: ['support', 'admin']
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
        },
        {
            name: 'Audit Logs',
            path: '/audit-logs',
            icon: Shield,
            roles: ['admin']
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
                    fixed left-0 z-40 bg-white shadow-xl flex flex-col
                    transform transition-all duration-300 ease-in-out
                    h-full lg:h-[calc(100vh-4rem)] lg:top-16
                    top-0 
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Internal Header (Mobile Only - for Close Button) */}
                <div className="flex lg:hidden items-center justify-between p-4 h-16 border-b border-gray-200">
                    <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Menu
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                    {visibleMenuItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <React.Fragment key={item.path}>
                                {item.divider && index > 0 && !isCollapsed && (
                                    <div className="my-2 border-t border-gray-200" />
                                )}
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    title={isCollapsed ? item.name : ''}
                                    className={`
                                        flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-lg
                                        transition-all duration-200
                                        ${active
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-gray-500'}`} />
                                    {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="border-t border-gray-200 p-4">
                    {!isCollapsed && (
                        <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.profile?.fullName || user?.emails?.[0]?.address || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize truncate">
                                {(user?.roles?.[0] || 'user')}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? "Logout" : ""}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors`}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex w-full items-center justify-center mt-2 pt-2 border-t border-gray-100 text-gray-400 hover:text-gray-600"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </aside>
        </>
    );
};
