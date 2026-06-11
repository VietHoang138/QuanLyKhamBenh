import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Không tìm thấy trang yêu cầu
            </h2>
            <Link to="/login" className="btn btn-primary">
                Quay lại Trang đăng nhập
            </Link>
        </div>
    );
};

export default NotFound;
