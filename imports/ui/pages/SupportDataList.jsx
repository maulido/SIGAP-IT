import React, { useState, useRef } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { SupportData } from '../../api/support-data/support-data';
import { SupportFiles } from '../../api/support-data/support-files';
import {
    Plus, Search, FileText, Server, Key, Lock, Eye, EyeOff,
    Trash2, Edit, Save, X, Upload, Download, AlertTriangle
} from 'lucide-react';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

export const SupportDataList = () => {
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [decryptedPasswords, setDecryptedPasswords] = useState({});

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { supportData, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('supportData.all');
        const fileHandle = Meteor.subscribe('files.supportFiles.all');

        return {
            supportData: SupportData.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready() || !fileHandle.ready()
        };
    }, []);

    const filteredData = supportData.filter(item => {
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const handleDelete = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            await Meteor.callAsync('supportData.remove', itemToDelete._id);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleViewPassword = async (id) => {
        if (decryptedPasswords[id]) {
            setDecryptedPasswords(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        } else {
            try {
                const result = await Meteor.callAsync('supportData.getDecryptedPassword', id);
                setDecryptedPasswords(prev => ({ ...prev, [id]: result }));
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const getFileLink = (fileId) => {
        const file = SupportFiles.findOne(fileId);
        return file ? file.link() : '#';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">IT Support Data</h1>
                    <p className="text-gray-500">Manage topologies, credentials, and documentation</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>Add New</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'topology', 'credential', 'general', 'backup'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filterType === type
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Loading data...</div>
                ) : filteredData.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No items found
                    </div>
                ) : (
                    filteredData.map(item => (
                        <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'credential' ? 'bg-yellow-100 text-yellow-600' :
                                            item.type === 'topology' ? 'bg-purple-100 text-purple-600' :
                                                item.type === 'backup' ? 'bg-green-100 text-green-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            {item.type === 'credential' ? <Key size={20} /> :
                                                item.type === 'topology' ? <Server size={20} /> :
                                                    item.type === 'backup' ? <Save size={20} /> :
                                                        <FileText size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 line-clamp-1" title={item.title}>{item.title}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {item.category || item.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {item.type === 'credential' && (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Username:</span>
                                                <span className="font-mono bg-gray-50 px-2 py-1 rounded">{item.data?.username || '-'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Password:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono bg-gray-50 px-2 py-1 rounded">
                                                        {decryptedPasswords[item._id] ? decryptedPasswords[item._id] : '••••••••'}
                                                    </span>
                                                    <button onClick={() => handleViewPassword(item._id)} className="text-gray-400 hover:text-gray-600">
                                                        {decryptedPasswords[item._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            {item.data?.link && (
                                                <div className="flex justify-between items-center text-sm mt-1">
                                                    <span className="text-gray-500">Link:</span>
                                                    <a href={item.data.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px]">
                                                        {item.data.link}
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {(item.type === 'topology' || item.type === 'backup') && item.data?.fileId && (
                                        <a
                                            href={getFileLink(item.data.fileId) + "?download=true"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center space-x-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-blue-600 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
                                        >
                                            <Download size={16} />
                                            <span>Download File</span>
                                        </a>
                                    )}

                                    {item.type === 'general' && (
                                        <p className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-2 rounded border border-gray-100">
                                            {item.data?.content || 'No content'}
                                        </p>
                                    )}

                                    {item.meta?.expiryDate && (
                                        <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded mt-2">
                                            <AlertTriangle size={12} />
                                            <span>Expires: {new Date(item.meta.expiryDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <ItemFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={editingItem}
                />
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Support Item"
                message="Are you sure you want to delete this item? This action usually cannot be undone."
                itemName={itemToDelete?.title}
                isDeleting={isDeleting}
            />
        </div>
    );
};

// Sub-component for Form Modal to keep main component clean
const ItemFormModal = ({ isOpen, onClose, item }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [formData, setFormData] = useState({
        title: item?.title || '',
        type: item?.type || 'credential',
        category: item?.category || '',
        username: item?.data?.username || '',
        password: '', // Always empty on edit for security, unless intended to change
        link: item?.data?.link || '', // Add link field
        content: item?.data?.content || '',
        fileId: item?.data?.fileId || '',
        expiryDate: item?.meta?.expiryDate ? new Date(item.meta.expiryDate).toISOString().split('T')[0] : '',
    });

    const isEdit = !!item;

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[SupportDataList] Submitting form...', formData);

        const dataPayload = {};
        if (formData.type === 'credential') {
            dataPayload.username = formData.username;
            dataPayload.password = formData.password;
            dataPayload.link = formData.link; // Include link in payload
        } else if (formData.type === 'general') {
            dataPayload.content = formData.content;
        } else {
            dataPayload.fileId = formData.fileId;
        }

        const modifier = {
            title: formData.title,
            type: formData.type,
            category: formData.category,
            data: dataPayload,
            meta: formData.expiryDate ? { expiryDate: new Date(formData.expiryDate) } : {}
        };

        if (isEdit && formData.type === 'credential' && !formData.password) {
            delete modifier.data.password;
        }

        try {
            if (isEdit) {
                // ... update payload const ...
                const updatePayload = {
                    $set: {
                        title: modifier.title,
                        type: modifier.type,
                        category: modifier.category,
                        'data.username': dataPayload.username,
                        'data.link': dataPayload.link, // Include link in update
                        'data.content': dataPayload.content,
                        'data.fileId': dataPayload.fileId,
                        meta: modifier.meta
                    }
                };
                if (dataPayload.password) updatePayload.$set['data.password'] = dataPayload.password;

                console.log('[SupportDataList] Calling update async...');
                await Meteor.callAsync('supportData.update', item._id, updatePayload);
                console.log('[SupportDataList] Update success');
                onClose();
            } else {
                console.log('[SupportDataList] Calling create async...');
                await Meteor.callAsync('supportData.create', modifier);
                console.log('[SupportDataList] Create success');
                onClose();
            }
        } catch (err) {
            console.error('[SupportDataList] Error:', err);
            alert('Failed: ' + err.message);
        }
    };

    const handleFileUpload = (e) => {
        if (e.currentTarget.files && e.currentTarget.files[0]) {
            const file = e.currentTarget.files[0];
            setUploading(true);

            const upload = SupportFiles.insert({
                file: file,
                streams: 'dynamic',
                chunkSize: 'dynamic'
            }, false);

            upload.on('start', () => {
                // console.log('start');
            });

            upload.on('end', (error, fileObj) => {
                setUploading(false);
                if (error) {
                    alert('Error during upload: ' + error);
                } else {
                    setFormData(prev => ({ ...prev, fileId: fileObj._id }));
                }
            });

            upload.on('progress', (progress) => {
                setUploadProgress(progress);
            });

            upload.start();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Item' : 'New Support Data'}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2"
                            disabled={isEdit} // Changing type usually complicates data structure, disable for simplicity
                        >
                            <option value="credential">Credential (Password)</option>
                            <option value="topology">Topology (Image/File)</option>
                            <option value="backup">Backup (File)</option>
                            <option value="general">General (Note)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2"
                            placeholder="e.g., Router Headquarters, AWS Root"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2"
                            placeholder="e.g., Network, Server, Cloud"
                        />
                    </div>

                    {/* Dynamic Fields */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        {formData.type === 'credential' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Username / ID</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">
                                        {isEdit ? 'New Password (Leave blank to keep)' : 'Password'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Login URL / Link / IP</label>
                                    <input
                                        type="text"
                                        value={formData.link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                                        placeholder="https://... or 192.168.1.1"
                                    />
                                </div>
                            </>
                        )}

                        {formData.type === 'general' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">Content</label>
                                <textarea
                                    rows={4}
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1"
                                />
                            </div>
                        )}

                        {(formData.type === 'topology' || formData.type === 'backup') && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">File Upload</label>
                                <div className="mt-1 flex items-center space-x-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                        <Upload size={16} />
                                        <span>{uploading ? `Uploading ${uploadProgress}%...` : 'Select File'}</span>
                                    </button>
                                    {formData.fileId && (
                                        <span className="text-sm text-green-600 flex items-center">
                                            <FileText size={16} className="mr-1" /> File Attached
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                        <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isEdit ? 'Save Changes' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
