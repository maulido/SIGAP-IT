import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, Link } from 'react-router-dom';
import moment from 'moment';
import { CategoryConfigs } from '../../api/category-configs/category-configs';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Printer', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_COLORS = {
    'Open': 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-purple-100 text-purple-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800',
    'Rejected': 'bg-red-100 text-red-800',
};

export const TicketCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Software',
        priority: 'Medium',
        location: '',
        metadata: {} // Store dynamic field values here
    });
    const [duplicates, setDuplicates] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [linkToParent, setLinkToParent] = useState(false);
    const [parentTicketNumber, setParentTicketNumber] = useState('');
    const [parentTicket, setParentTicket] = useState(null);
    const [searchingParent, setSearchingParent] = useState(false);
    const [kbRecommendations, setKbRecommendations] = useState([]);

    // Asset Linking
    const [assetTag, setAssetTag] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [searchingAsset, setSearchingAsset] = useState(false);
    const [assetError, setAssetError] = useState('');

    // Subscribe to Category Configs
    const { categoryConfig, isLoadingConfig } = useTracker(() => {
        const handle = Meteor.subscribe('categoryConfigs.all'); // We might need to create this publication
        const config = CategoryConfigs.findOne({ category: formData.category, isActive: true });
        return {
            categoryConfig: config,
            isLoadingConfig: !handle.ready()
        };
    }, [formData.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Check for duplicates when title, category, or location changes
        if ((name === 'title' || name === 'category' || name === 'location') &&
            formData.title && formData.category && formData.location) {
            checkDuplicates();
        }
    };

    const handleMetadataChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [name]: value
            }
        }));
    };

    const checkDuplicates = () => {
        if (formData.title.length < 5) return;

        Meteor.call('tickets.checkDuplicates', {
            title: formData.title,
            category: formData.category,
            location: formData.location,
        }, (err, result) => {
            if (!err && result) {
                setDuplicates(result);
            }
        });
    };

    // Get KB recommendations based on title and category
    useEffect(() => {
        if (formData.title.length > 10 && formData.category) {
            const timer = setTimeout(async () => {
                try {
                    const recommendations = await Meteor.callAsync('kb.getRecommendations', {
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                    });
                    setKbRecommendations(recommendations || []);
                } catch (err) {
                    console.error('Failed to get KB recommendations:', err);
                    setKbRecommendations([]);
                }
            }, 500); // Debounce 500ms

            return () => clearTimeout(timer);
        } else {
            setKbRecommendations([]);
        }
    }, [formData.title, formData.description, formData.category]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setUploadError('');

        const validFiles = files.filter(file => {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setUploadError(`${file.name} exceeds 5MB limit`);
                return false;
            }

            // Check file type
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];

            if (!allowedTypes.includes(file.type)) {
                setUploadError(`${file.name} has unsupported file type`);
                return false;
            }

            return true;
        });

        setAttachments(prev => [...prev, ...validFiles]);
    };

    const handleRemoveFile = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setUploadError('');
    };

    const uploadFile = (file, ticketId) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];

                Meteor.call('attachments.upload', {
                    ticketId,
                    filename: file.name,
                    contentType: file.type,
                    size: file.size,
                    data: base64,
                }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const handleSearchParent = async () => {
        if (!parentTicketNumber.trim()) {
            setError('Please enter a ticket number');
            return;
        }

        setSearchingParent(true);
        setError('');
        setParentTicket(null);

        try {
            const result = await Meteor.callAsync('tickets.searchByNumber', parentTicketNumber.trim().toUpperCase());

            if (result) {
                setParentTicket(result);
            } else {
                setError('Parent ticket not found');
            }
        } catch (err) {
            setError(err.reason || 'Failed to search ticket');
        } finally {
            setSearchingParent(false);
        }
    };

    const handleSearchAsset = async () => {
        if (!assetTag.trim()) return;

        setSearchingAsset(true);
        setAssetError('');
        setSelectedAsset(null);

        try {
            const results = await Meteor.callAsync('assets.search', assetTag);
            if (results && results.length > 0) {
                // For simplicity, just pick the first match or exact match
                // Ideally show a list, but this is a quick implementation
                const exactMatch = results.find(a => a.assetTag.toLowerCase() === assetTag.toLowerCase());
                setSelectedAsset(exactMatch || results[0]);
            } else {
                setAssetError('Asset not found');
            }
        } catch (err) {
            setAssetError('Error searching asset');
        } finally {
            setSearchingAsset(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Create ticket first
            const result = await new Promise((resolve, reject) => {
                const payload = { ...formData };
                if (selectedAsset) payload.assetId = selectedAsset._id;

                Meteor.call('tickets.create', payload, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });

            const ticketId = result.ticketId;

            // Upload attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    await uploadFile(file, ticketId);
                }
            }

            // Link to parent if specified
            if (linkToParent && parentTicket) {
                try {
                    await Meteor.callAsync('tickets.linkAsChild', {
                        parentTicketId: parentTicket._id,
                        childTicketId: ticketId,
                    });
                } catch (linkErr) {
                    console.error('Failed to link to parent:', linkErr);
                    // Don't fail the whole operation if linking fails
                }
            }

            navigate(`/tickets/${ticketId}`);
        } catch (err) {
            setError(err.reason || 'Failed to create ticket');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
                <p className="text-gray-600 mt-1">Report a new IT issue or request</p>
            </div>

            {/* KB Recommendations */}
            {kbRecommendations.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-blue-800">
                                💡 Suggested Solutions
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>These Knowledge Base articles might help solve your issue:</p>
                            </div>
                            <div className="mt-4 space-y-2">
                                {kbRecommendations.map(article => (
                                    <Link
                                        key={article._id}
                                        to={`/kb/${article._id}`}
                                        target="_blank"
                                        className="block bg-white p-3 rounded border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all"
                                    >
                                        <p className="text-sm font-medium text-blue-900">{article.title}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-blue-600">{article.category}</span>
                                            <span className="text-xs text-blue-400">•</span>
                                            <span className="text-xs text-blue-600">{article.viewCount} views</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-blue-600">
                                💡 Tip: If these articles solve your issue, you don't need to create a ticket!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {duplicates.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Similar Tickets Found
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>We found {duplicates.length} similar ticket(s) from the last 7 days. Please review them before creating a new ticket:</p>
                            </div>
                            <div className="mt-4">
                                <div className="space-y-3">
                                    {duplicates.map(ticket => (
                                        <div key={ticket._id} className="bg-white rounded-md p-3 border border-yellow-200 shadow-sm">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {ticket.ticketNumber}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm font-medium text-gray-900">{ticket.title}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Created {moment(ticket.createdAt).fromNow()} • {ticket.category}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/tickets/${ticket._id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none transition-colors"
                                                >
                                                    View Ticket
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setDuplicates([])}
                                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                                >
                                    Dismiss and proceed anyway
                                </button>
                                <span className="text-sm text-yellow-600">•</span>
                                <span className="text-sm text-yellow-700">
                                    If none of these match your issue, you can proceed with creating a new ticket
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        className="input-field"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        maxLength={200}
                        placeholder="Brief description of the issue"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        className="input-field"
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Detailed description of the issue, including steps to reproduce if applicable"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="category"
                            name="category"
                            className="input-field"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            className="input-field"
                            value={formData.priority}
                            onChange={handleChange}
                            required
                        >
                            {PRIORITIES.map(pri => (
                                <option key={pri} value={pri}>{pri}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dynamic Fields Section */}
                {categoryConfig && categoryConfig.fields && categoryConfig.fields.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">{formData.category} Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryConfig.fields.map((field) => (
                                <div key={field.name} className="col-span-1">
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            className="input-field"
                                            value={formData.metadata[field.name] || ''}
                                            onChange={handleMetadataChange}
                                            required={field.required}
                                        >
                                            <option value="">Select {field.label}</option>
                                            {field.options && field.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            id={field.name}
                                            name={field.name}
                                            className="input-field"
                                            placeholder={field.placeholder}
                                            value={formData.metadata[field.name] || ''}
                                            onChange={handleMetadataChange}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Location/Department <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="location"
                        name="location"
                        type="text"
                        className="input-field"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Finance Dept - 3rd Floor"
                    />
                </div>

                {/* File Attachments and Parent Link... (Keeping existing code) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="mt-2 text-sm font-medium text-gray-600">
                                Click to upload or drag and drop
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                                Max 5MB per file (Images, PDF, Word, Excel)
                            </span>
                        </label>
                    </div>

                    {uploadError && (
                        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                    )}

                    {/* File List */}
                    {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                                {attachments.length} file(s) selected
                            </p>
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        title="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                {/* Asset Linking */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Related Asset (Optional)
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={assetTag}
                            onChange={(e) => setAssetTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAsset())}
                            className="input-field flex-1"
                            placeholder="Enter Asset Tag (e.g., LP-001) or Name"
                        />
                        <button
                            type="button"
                            onClick={handleSearchAsset}
                            disabled={searchingAsset || !assetTag.trim()}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                            {searchingAsset ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                    {assetError && <p className="mt-1 text-sm text-red-600">{assetError}</p>}

                    {selectedAsset && (
                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{selectedAsset.assetTag} - {selectedAsset.name}</p>
                                <p className="text-xs text-gray-500">{selectedAsset.brand} {selectedAsset.model}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedAsset(null); setAssetTag(''); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Parent Link Option */}
                <div className="mb-6">
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="linkToParent"
                            checked={linkToParent}
                            onChange={(e) => {
                                setLinkToParent(e.target.checked);
                                if (!e.target.checked) {
                                    setParentTicket(null);
                                    setParentTicketNumber('');
                                }
                            }}
                            className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="linkToParent" className="ml-2 text-sm font-medium text-gray-700">
                            Link this ticket as a sub-ticket
                        </label>
                    </div>

                    {linkToParent && (
                        <div className="ml-6 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parent Ticket Number
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={parentTicketNumber}
                                        onChange={(e) => setParentTicketNumber(e.target.value.toUpperCase())}
                                        className="input-field flex-1"
                                        placeholder="e.g., TKT-2026-0001"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchParent}
                                        disabled={searchingParent || !parentTicketNumber.trim()}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {searchingParent ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </div>

                            {parentTicket && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-blue-900">
                                                {parentTicket.ticketNumber}: {parentTicket.title}
                                            </p>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${parentTicket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                    parentTicket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                        parentTicket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {parentTicket.status}
                                                </span>
                                                <span className="text-xs text-blue-700">
                                                    {parentTicket.category} | {parentTicket.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setParentTicket(null);
                                                setParentTicketNumber('');
                                            }}
                                            className="ml-2 text-blue-600 hover:text-blue-800"
                                            title="Clear"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};

