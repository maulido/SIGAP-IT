import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Assets } from '../../api/assets/assets';
import { Link } from 'react-router-dom';
import moment from 'moment';

export const AssetList = () => {
    const { assets, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('assets.all');
        return {
            assets: Assets.find({}, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !handle.ready()
        };
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        assetTag: '',
        name: '',
        type: 'Laptop',
        brand: '',
        model: '',
        serialNumber: '',
        status: 'Active',
        location: '',
        purchaseDate: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const filteredAssets = assets.filter(asset =>
        asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const method = editingId ? 'assets.update' : 'assets.create';
        const payload = {
            ...formData,
            purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : null,
        };

        if (editingId) payload._id = editingId;

        try {
            await Meteor.callAsync(method, payload);
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert(error.reason || 'Failed to save asset');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try {
            await Meteor.callAsync('assets.delete', id);
        } catch (error) {
            alert(error.reason || 'Failed to delete');
        }
    };

    const handleEdit = (asset) => {
        setFormData({
            assetTag: asset.assetTag,
            name: asset.name,
            type: asset.type,
            brand: asset.brand || '',
            model: asset.model || '',
            serialNumber: asset.serialNumber || '',
            status: asset.status,
            location: asset.location || '',
            purchaseDate: asset.purchaseDate ? moment(asset.purchaseDate).format('YYYY-MM-DD') : '',
            notes: asset.notes || ''
        });
        setEditingId(asset._id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            assetTag: '',
            name: '',
            type: 'Laptop',
            brand: '',
            model: '',
            serialNumber: '',
            status: 'Active',
            location: '',
            purchaseDate: '',
            notes: ''
        });
        setEditingId(null);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">IT Asset Management</h1>
                    <p className="text-gray-600">Manage hardware inventory</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                >
                    + New Asset
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Tag, Name, or Serial..."
                    className="w-full px-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAssets.map((asset) => (
                            <tr key={asset._id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">
                                    <Link to={`/admin/assets/${asset._id}`} className="hover:underline">
                                        {asset.assetTag}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                    <div className="text-sm text-gray-500">{asset.brand} {asset.model}</div>
                                    <div className="text-xs text-gray-400">{asset.serialNumber}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {asset.assignedToName || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                                            asset.status === 'InRepair' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {asset.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(asset)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(asset._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit' : 'Create'} Asset</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Asset Tag *</label>
                                    <input type="text" required className="mt-1 block w-full rounded border p-2" value={formData.assetTag} onChange={e => setFormData({ ...formData, assetTag: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                                    <select className="mt-1 block w-full rounded border p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option>Laptop</option>
                                        <option>Desktop</option>
                                        <option>Monitor</option>
                                        <option>Printer</option>
                                        <option>Networking</option>
                                        <option>Accessory</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Name / Description *</label>
                                    <input type="text" required className="mt-1 block w-full rounded border p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                                    <input type="text" className="mt-1 block w-full rounded border p-2" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Model</label>
                                    <input type="text" className="mt-1 block w-full rounded border p-2" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                                    <input type="text" className="mt-1 block w-full rounded border p-2" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select className="mt-1 block w-full rounded border p-2" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="InStore">In Store</option>
                                        <option value="InRepair">In Repair</option>
                                        <option value="Retired">Retired</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                                    <input type="date" className="mt-1 block w-full rounded border p-2" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location</label>
                                    <input type="text" className="mt-1 block w-full rounded border p-2" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea className="mt-1 block w-full rounded border p-2" rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded">Cancel</button>
                                <button type="submit" disabled={submitting} className="bg-primary-600 text-white px-4 py-2 rounded">{submitting ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
