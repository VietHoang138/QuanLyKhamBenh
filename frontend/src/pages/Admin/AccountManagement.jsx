import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Users, Trash2, Mail, Phone, Shield, UserCheck, AlertTriangle } from 'lucide-react';

const AccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchAccounts = async () => {
        try {
            const res = await adminService.getAccounts();
            setAccounts(res.data);
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError('Không thể tải danh sách tài khoản.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleDelete = async (id, fullName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản của "${fullName}" không?`)) {
            return;
        }

        setError('');
        setSuccess('');
        try {
            await adminService.deleteAccount(id);
            setSuccess(`Đã xóa tài khoản của "${fullName}" thành công.`);
            fetchAccounts();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa tài khoản. Lưu ý: không thể xóa tài khoản đã có dữ liệu bệnh án hoặc lịch khám.');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-danger';
            case 'doctor': return 'badge-approved';
            case 'patient': return 'badge-completed';
            default: return '';
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'doctor': return 'Bác sĩ';
            case 'patient': return 'Bệnh nhân';
            default: return role;
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Quản Lý Tài Khoản</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Quản trị toàn bộ danh sách tài khoản trong hệ thống phòng khám bệnh bao gồm Bệnh nhân, Bác sĩ và Quản trị viên.
            </p>

            {success && (
                <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {success}
                </div>
            )}

            {error && (
                <div style={{ backgroundColor: 'var(--danger-bg)', color: '#EF4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--primary)" />
                    Danh sách người dùng ({accounts.length})
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Đang tải danh sách tài khoản...
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Họ và tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Địa chỉ</th>
                                    <th>Vai trò</th>
                                    <th>Chuyên khoa (Bác sĩ)</th>
                                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(acc => (
                                    <tr key={acc.Id}>
                                        <td style={{ fontWeight: 600 }}>{acc.FullName}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Mail size={14} color="var(--text-muted)" />
                                                {acc.Email}
                                            </div>
                                        </td>
                                        <td>
                                            {acc.Phone ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Phone size={14} color="var(--text-muted)" />
                                                    {acc.Phone}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>{acc.Address || '-'}</td>
                                        <td>
                                            <span className={`badge ${getRoleBadgeClass(acc.Role)}`}>
                                                {getRoleText(acc.Role)}
                                            </span>
                                        </td>
                                        <td>{acc.SpecializationName || '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleDelete(acc.Id, acc.FullName)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                    disabled={acc.Role === 'admin'} // Protect admins
                                                    title={acc.Role === 'admin' ? "Không thể xóa tài khoản Admin" : "Xóa tài khoản"}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountManagement;
