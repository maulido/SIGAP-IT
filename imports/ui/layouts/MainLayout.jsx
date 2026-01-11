import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile Drawer State
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Minimize State

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* 1. Global Header (Fixed Top) */}
            <Header onMenuClick={() => {
                if (window.innerWidth >= 1024) {
                    setIsCollapsed(!isCollapsed);
                } else {
                    setSidebarOpen(!sidebarOpen);
                }
            }} />

            {/* 2. Main Layout Container (Below Header) */}
            <div className="flex flex-1 pt-16">

                {/* Sidebar */}
                {/* Note: Sidebar has 'fixed top-16' positioning internally */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={isCollapsed}
                    toggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Page Content Area */}
                <div className={`
                    flex-1 flex flex-col min-w-0 transition-all duration-300
                    ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
                `}>
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto w-full">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};
