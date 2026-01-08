import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Printer', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const TicketCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Software',
        priority: 'Medium',
        location: '',
    });
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Check for duplicates when title, category, or location changes
        if ((name === 'title' || name === 'category' || name === 'location') &&
            formData.title && formData.category && formData.location) {
            checkDuplicates();
        }
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        Meteor.call('tickets.create', formData, (err, result) => {
            setLoading(false);
            if (err) {
                setError(err.reason || 'Failed to create ticket');
            } else {
                navigate(`/tickets/${result.ticketId}`);
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
                <p className="text-gray-600 mt-1">Report a new IT issue or request</p>
            </div>

            {duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        ⚠️ Similar tickets found
                    </h3>
                    <p className="text-sm text-yellow-700 mb-2">
                        We found {duplicates.length} similar ticket(s). Please check if your issue is already reported:
                    </p>
                    <ul className="space-y-1">
                        {duplicates.map(ticket => (
                            <li key={ticket._id} className="text-sm">
                                <a
                                    href={`/tickets/${ticket._id}`}
                                    className="text-yellow-800 hover:text-yellow-900 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {ticket.ticketNumber}: {ticket.title}
                                </a>
                            </li>
                        ))}
                    </ul>
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
