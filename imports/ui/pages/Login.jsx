import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Use custom login method
        Meteor.call('users.login', email, password, (err, result) => {
            if (err) {
                setLoading(false);
                console.error('Login error:', err);
                setError(err.reason || err.message || 'Login failed. Please try again.');
            } else {
                // Set the login token
                Meteor.loginWithToken(result.token, (tokenErr) => {
                    setLoading(false);
                    if (tokenErr) {
                        console.error('Token error:', tokenErr);
                        setError('Login failed. Please try again.');
                    } else {
                        console.log('Login successful!');
                        navigate('/dashboard');
                    }
                });
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
                        SIGAP-IT
                    </h1>
                    <p className="text-white text-lg opacity-90">
                        Sistem Informasi Gangguan & Penanganan IT
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        Login
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <p className="font-medium">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-6 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center"
                            style={{
                                background: loading ? '#9333ea' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                opacity: loading ? 0.7 : 1
                            }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Default Credentials Info */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600 mb-2">
                            Default Admin Credentials:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="font-mono text-sm text-gray-800">
                                <span className="font-semibold">Email:</span> admin@sigap-it.com
                            </p>
                            <p className="font-mono text-sm text-gray-800">
                                <span className="font-semibold">Password:</span> admin123
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white text-sm mt-6 opacity-75">
                    © 2026 SIGAP-IT. All rights reserved.
                </p>
            </div>
        </div>
    );
};
