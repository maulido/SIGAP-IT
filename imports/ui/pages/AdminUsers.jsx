import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

const ROLES = [
    { value: 'user', label: 'User' },
    { value: 'support', label: 'IT Support' },
    { value: 'admin', label: 'Admin' },
];

export const AdminUsers = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        department: '',
        location: '',
        phone: '',
        role: 'user',
    });
    const [newPassword, setNewPassword] = useState('');

    const { users, isLoading, currentUser } = useTracker(() => {
        const handle = Meteor.subscribe('users.all');
        const currentUserHandle = Meteor.subscribe('users.current');

        return {
            users: Meteor.users.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready() || !currentUserHandle.ready(),
            currentUser: Meteor.user(),
        };
    });

    // Check if current user is admin
    const isAdmin = currentUser?.roles?.includes('admin');

    if (!isAdmin) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="card text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery ||
            user.profile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.emails?.[0]?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.profile?.department?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = !roleFilter || user.roles?.includes(roleFilter);

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && user.profile?.isActive) ||
            (statusFilter === 'inactive' && !user.profile?.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await Meteor.callAsync('users.register', formData);
            setShowCreateModal(false);
            setFormData({
                email: '',
                password: '',
                fullName: '',
                department: '',
                location: '',
                phone: '',
                role: 'user',
            });
            alert('User created successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await Meteor.callAsync('users.update', {
                userId: editingUser._id,
                fullName: formData.fullName,
                department: formData.department,
                location: formData.location,
                phone: formData.phone,
                role: formData.role, // Include role
            });
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                fullName: '',
                department: '',
                location: '',
                phone: '',
                role: 'user',
            });
            alert('User updated successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            if (currentStatus) {
                await Meteor.callAsync('users.deactivate', userId);
            } else {
                await Meteor.callAsync('users.activate', userId);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            await Meteor.callAsync('users.changeRole', { userId, newRole });
            alert('Role changed successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await Meteor.callAsync('users.resetPassword', {
                userId: showResetPasswordModal,
                newPassword,
            });
            setShowResetPasswordModal(null);
            setNewPassword('');
            alert('Password reset successfully!');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.emails?.[0]?.address || '',
            password: '',
            fullName: user.profile?.fullName || '',
            department: user.profile?.department || '',
            location: user.profile?.location || '',
            phone: user.profile?.phone || '',
            role: user.roles?.[0] || 'user',
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage system users and their roles</p>
            </div>

            {/* Filters and Actions */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or department..."
                            className="input-field"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="">All Roles</option>
                        {ROLES.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary whitespace-nowrap"
                    >
                        + Create User
                    </button>
                </div>
            </div>

            {/* User List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-600">No users found</p>
                </div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                <span className="text-primary-600 font-medium">
                                                    {user.profile?.fullName?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.profile?.fullName || 'No Name'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.emails?.[0]?.address}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.profile?.department || '-'}</div>
                                        <div className="text-sm text-gray-500">{user.profile?.location || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.roles?.[0] || 'user'}
                                            onChange={(e) => handleChangeRole(user._id, e.target.value)}
                                            className="text-sm border-gray-300 rounded-md"
                                            disabled={user._id === currentUser._id}
                                        >
                                            {ROLES.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(user._id, user.profile?.isActive)}
                                            disabled={user._id === currentUser._id}
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.profile?.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                } ${user._id === currentUser._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                                        >
                                            {user.profile?.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-primary-600 hover:text-primary-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setShowResetPasswordModal(user._id)}
                                            className="text-orange-600 hover:text-orange-900"
                                            disabled={user._id === currentUser._id}
                                        >
                                            Reset Password
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role *
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="input-field"
                                    >
                                        {ROLES.map(role => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Create User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({
                                            email: '',
                                            password: '',
                                            fullName: '',
                                            department: '',
                                            location: '',
                                            phone: '',
                                            role: 'user',
                                        });
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        disabled
                                        value={formData.email}
                                        className="input-field bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role *
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="input-field"
                                        required
                                    >
                                        <option value="user">User</option>
                                        <option value="support">Support</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Update User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingUser(null);
                                        setFormData({
                                            email: '',
                                            password: '',
                                            fullName: '',
                                            department: '',
                                            location: '',
                                            phone: '',
                                            role: 'user',
                                        });
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Enter a new password for this user
                            </p>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Reset Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetPasswordModal(null);
                                        setNewPassword('');
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
