import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundColor: 'var(--bg-main)',
                color: 'var(--primary)',
                fontSize: '1.2rem',
                fontWeight: 600
            }}>
                Đang tải hệ thống...
            </div>
        );
    }

    if (!token || !user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.Role)) {
        // If authenticated but role not allowed, redirect to default landing page based on role
        if (user.Role === 'patient') {
            return <Navigate to="/patient" replace />;
        } else if (user.Role === 'doctor') {
            return <Navigate to="/doctor" replace />;
        } else if (user.Role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
