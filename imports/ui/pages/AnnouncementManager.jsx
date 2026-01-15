import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Announcements } from '../../api/announcements/announcements';
import moment from 'moment';

export const AnnouncementManager = () => {
    const { announcements, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('announcements.all');
        return {
            announcements: Announcements.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready()
        };
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        startAt: moment().format('YYYY-MM-DDTHH:mm'),
        endAt: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm'),
        isActive: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const method = editingId ? 'announcements.update' : 'announcements.create';
        const payload = {
            ...formData,
            startAt: new Date(formData.startAt),
            endAt: new Date(formData.endAt),
        };

        if (editingId) payload._id = editingId;

        try {
            await Meteor.callAsync(method, payload);
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert(error.reason || 'Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await Meteor.callAsync('announcements.delete', id);
        } catch (error) {
            alert(error.reason || 'Failed to delete');
        }
    };

    const handleEdit = (announcement) => {
        setFormData({
            title: announcement.title,
            message: announcement.message,
            type: announcement.type,
            startAt: moment(announcement.startAt).format('YYYY-MM-DDTHH:mm'),
            endAt: moment(announcement.endAt).format('YYYY-MM-DDTHH:mm'),
            isActive: announcement.isActive,
        });
        setEditingId(announcement._id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            message: '',
            type: 'info',
            startAt: moment().format('YYYY-MM-DDTHH:mm'),
            endAt: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm'),
            isActive: true,
        });
        setEditingId(null);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Announcements</h1>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                >
                    + New Announcement
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {announcements.map((a) => (
                            <tr key={a._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{a.title}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{a.message}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${a.type === 'critical' ? 'bg-red-100 text-red-800' :
                                            a.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                        {a.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {moment(a.startAt).format('DD/MM HH:mm')} - {moment(a.endAt).format('DD/MM HH:mm')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {a.isActive ? 'Active' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(a)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit' : 'Create'} Announcement</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    rows="3"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start At</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={formData.startAt}
                                        onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End At</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={formData.endAt}
                                        onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                                >
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
