import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { CannedResponses } from '../../api/canned-responses/canned-responses';
import { Roles } from '../../api/roles/roles';
import { Plus, Edit2, Trash2, X, Search, CheckCircle } from 'lucide-react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

export const SavedReplies = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        shortcut: '',
        content: ''
    });

    const { cannedResponses, isLoading, userRoles } = useTracker(() => {
        const handle = Meteor.subscribe('cannedResponses.all');
        const currentUser = Meteor.user();

        return {
            cannedResponses: CannedResponses.find({}, { sort: { category: 1, title: 1 } }).fetch(),
            isLoading: !handle.ready(),
            userRoles: currentUser ? Roles.getRolesForUser(currentUser._id) : []
        };
    });

    const isSupport = userRoles.includes('support') || userRoles.includes('admin');

    if (!isSupport) {
        return (
            <div className="card text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
                <p className="text-gray-600 mt-2">Only IT Support can access this page.</p>
            </div>
        );
    }

    const filteredResponses = cannedResponses.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                category: item.category,
                shortcut: item.shortcut,
                content: item.content
            });
        } else {
            setEditingItem(null);
            setFormData({ title: '', category: '', shortcut: '', content: '' });
        }
        setIsModalOpen(true);
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await Meteor.callAsync('cannedResponses.remove', itemToDelete._id);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await Meteor.callAsync('cannedResponses.update', editingItem._id, formData);
            } else {
                await Meteor.callAsync('cannedResponses.create', formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Saved Replies</h1>
                    <p className="text-gray-600 mt-1">Manage canned responses for quick ticket replies</p>
                </div>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>Create New</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : filteredResponses.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500">No saved replies found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResponses.map(item => (
                        <div key={item._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600 mb-2">
                                        {item.category}
                                    </span>
                                    <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(item)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3 bg-gray-50 p-3 rounded border border-gray-100 italic">
                                "{item.content}"
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 font-mono">
                                    {item.shortcut}
                                </code>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full m-4 p-6 animate-slideUp">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {editingItem ? 'Edit Saved Reply' : 'New Saved Reply'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Printer Reset Instructions"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Hardware"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shortcut (Optional)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.shortcut}
                                        onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                                        placeholder="e.g. /printer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    required
                                    rows="6"
                                    className="input-field font-sans"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Enter the template text here..."
                                ></textarea>
                            </div>

                            <div className="flex justify-end pt-4 space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editingItem ? 'Update Reply' : 'Save Reply'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Saved Reply"
                message="Are you sure you want to delete this specific reply template?"
                isDeleting={isDeleting}
                itemName={itemToDelete?.title}
            />
        </div>
    );
};
