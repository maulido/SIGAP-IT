import React, { useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams, useNavigate } from 'react-router-dom';
import { KBArticles } from '../../api/kb-articles/kb-articles';
import moment from 'moment';

export const KBArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { article, isLoading } = useTracker(() => {
        const handle = Meteor.subscribe('kb.byId', id);

        return {
            article: KBArticles.findOne(id),
            isLoading: !handle.ready(),
        };
    });

    useEffect(() => {
        if (article) {
            Meteor.call('kb.incrementView', id);
        }
    }, [id, article]);

    const handleHelpful = () => {
        Meteor.call('kb.markHelpful', id, (err) => {
            if (!err) {
                alert('Thank you for your feedback!');
            }
        });
    };

    const handleNotHelpful = () => {
        Meteor.call('kb.markNotHelpful', id, (err) => {
            if (!err) {
                alert('Thank you for your feedback!');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading article...</p>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="card text-center py-12">
                    <h2 className="text-xl font-semibold text-gray-900">Article not found</h2>
                    <p className="text-gray-600 mt-2">The article you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/kb')}
                        className="btn-primary mt-4"
                    >
                        Back to Knowledge Base
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/kb')}
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Knowledge Base
            </button>

            {/* Article */}
            <div className="card">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                            {article.category}
                        </span>
                        <span className="text-sm text-gray-500">
                            {article.viewCount} views
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {article.title}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Last updated {moment(article.updatedAt).fromNow()}
                    </p>
                </div>

                {/* Content */}
                <div className="prose max-w-none mb-8">
                    <div className="whitespace-pre-wrap text-gray-700">
                        {article.content}
                    </div>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {article.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Helpful Section */}
                <div className="border-t pt-6">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                        Was this article helpful?
                    </p>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleHelpful}
                            className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            Yes ({article.helpfulCount || 0})
                        </button>
                        <button
                            onClick={handleNotHelpful}
                            className="flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                            No ({article.notHelpfulCount || 0})
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        If this article didn't help, please create a support ticket for personalized assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};
