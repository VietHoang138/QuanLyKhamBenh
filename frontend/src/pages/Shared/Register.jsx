import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, KeyRound, Mail, User, Phone, MapPin, Calendar, Users, AlertTriangle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'Nam'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const result = await register(formData);
        if (result.success) {
            setSuccess('Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(result.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page" style={{ padding: '4rem 2rem' }}>
            <div className="auth-card glass fade-in" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <HeartPulse size={48} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
                </div>
                <h2 className="auth-title">Đăng Ký Khám Bệnh</h2>
                <p className="auth-subtitle">Tạo tài khoản bệnh nhân để đặt lịch khám và tra cứu bệnh án</p>

                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--danger-bg)',
                        color: '#EF4444',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div style={{
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Mail size={14} /> Email *
                                </span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <KeyRound size={14} /> Mật khẩu *
                                </span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <User size={14} /> Họ và Tên *
                            </span>
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            className="form-input"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="phone">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Phone size={14} /> Số điện thoại
                                </span>
                            </label>
                            <input
                                type="text"
                                id="phone"
                                className="form-input"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="dateOfBirth">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Calendar size={14} /> Ngày sinh
                                </span>
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                className="form-input"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="gender">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Users size={14} /> Giới tính
                                </span>
                            </label>
                            <select
                                id="gender"
                                className="form-input"
                                value={formData.gender}
                                onChange={handleChange}
                                style={{ background: '#0D1322', color: '#FFF' }}
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="address">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={14} /> Địa chỉ
                                </span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                className="form-input"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký Tài Khoản'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Đã có tài khoản?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
