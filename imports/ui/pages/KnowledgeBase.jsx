import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Link } from 'react-router-dom';
import { KBArticles } from '../../api/kb-articles/kb-articles';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Printer', 'Other'];

export const KnowledgeBase = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const { articles, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('kb.published', {
            category: selectedCategory || undefined,
        });

        return {
            articles: KBArticles.find({}, { sort: { viewCount: -1, createdAt: -1 } }).fetch(),
            isLoading: !handle.ready(),
        };
    });

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await Meteor.callAsync('kb.search', {
                query: searchQuery,
                category: selectedCategory,
                limit: 20,
            });
            setSearchResults(results);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const displayArticles = searchResults.length > 0 ? searchResults : articles;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
                <p className="text-gray-600 mt-1">Find solutions to common IT issues</p>
            </div>

            {/* Search & Filter */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search articles..."
                            className="input-field"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="btn-primary"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Articles List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading articles...</p>
                </div>
            ) : displayArticles.length === 0 ? (
                <div className="card text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? 'Try a different search term' : 'No articles available yet'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayArticles.map(article => (
                        <Link
                            key={article._id}
                            to={`/kb/${article._id}`}
                            className="card hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                    {article.category}
                                </span>
                                <div className="flex items-center text-xs text-gray-500">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {article.viewCount}
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {article.content}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-3">
                                    {article.helpfulCount > 0 && (
                                        <span className="flex items-center text-green-600">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                            </svg>
                                            {article.helpfulCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-blue-600 hover:text-blue-800">
                                    Read more →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
