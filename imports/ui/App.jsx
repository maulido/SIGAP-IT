import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TicketCreate } from './pages/TicketCreate';
import { TicketList } from './pages/TicketList';

// Layouts
import { MainLayout } from './layouts/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { userId, isLoading } = useTracker(() => ({
    userId: Meteor.userId(),
    isLoading: Meteor.loggingIn(),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return userId ? children : <Navigate to="/login" replace />;
};

export const App = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/create" element={<TicketCreate />} />
      </Route>
    </Routes>
  </Router>
);
