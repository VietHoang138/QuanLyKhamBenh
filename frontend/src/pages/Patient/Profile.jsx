import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, MapPin, Calendar, Users, Mail, Check, AlertTriangle } from 'lucide-react';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'Nam'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.FullName || '',
                phone: user.Phone || '',
                address: user.Address || '',
                dateOfBirth: user.DateOfBirth ? new Date(user.DateOfBirth).toISOString().split('T')[0] : '',
                gender: user.Gender || 'Nam'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        setLoading(true);

        const res = await updateProfile(formData);
        if (res.success) {
            setSuccess('Cập nhật hồ sơ thành công!');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '0.25rem' }}>Hồ Sơ Cá Nhân</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Quản lý và cập nhật thông tin liên hệ của bạn để phục vụ việc chẩn đoán và ghi nhận bệnh án.
            </p>

            <div className="glass" style={{ padding: '2.5rem', borderRadius: 'var(--radius-md)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    Thông tin liên hệ bệnh nhân
                </h2>

                {success && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <Check size={18} />
                        <span>{success}</span>
                    </div>
                )}

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

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        
                        {/* Email (Readonly) */}
                        <div className="form-group">
                            <label className="form-label">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Mail size={14} /> Địa chỉ Email
                                </span>
                            </label>
                            <input
                                type="email"
                                className="form-input"
                                value={user?.Email || ''}
                                disabled
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Full Name */}
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

                        {/* Phone */}
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

                        {/* Date of Birth */}
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

                        {/* Gender */}
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

                        {/* Address */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="address">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={14} /> Địa chỉ thường trú
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
                        style={{ padding: '0.75rem 2rem', marginTop: '1.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
