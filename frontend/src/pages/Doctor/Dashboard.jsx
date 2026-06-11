import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorService } from '../../services/api';
import { Calendar, Clock, User, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const fetchAppointments = async () => {
        try {
            const res = await doctorService.getAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error('Error fetching doctor appointments:', err);
            setError('Không thể tải danh sách lịch hẹn khám.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        setError('');
        setSuccess('');
        try {
            await doctorService.updateAppointmentStatus(id, newStatus);
            setSuccess(`Đã cập nhật trạng thái lịch khám thành công.`);
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi cập nhật trạng thái.');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'approved': return 'badge-info';
            case 'completed': return 'badge-success';
            case 'cancelled': return 'badge-danger';
            default: return '';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ duyệt';
            case 'approved': return 'Đã duyệt';
            case 'completed': return 'Đã khám xong';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Lịch Hẹn Khám Bệnh Nhân</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Quản lý các ca đăng ký khám hẹn trước, phê duyệt lịch hẹn và tiến hành khám lập bệnh án y tế.
            </p>

            {success && (
                <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {success}
                </div>
            )}

            {error && (
                <div style={{ backgroundColor: 'var(--danger-bg)', color: '#EF4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Danh sách lịch khám của bạn</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Đang tải dữ liệu...
                    </div>
                ) : appointments.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem 1rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        gap: '1rem'
                    }}>
                        <AlertCircle size={48} color="var(--text-muted)" />
                        <div>
                            <p style={{ fontWeight: 600, color: '#FFF' }}>Không có lịch hẹn khám nào</p>
                            <p style={{ fontSize: '0.9rem' }}>Bệnh nhân đăng ký khám với bạn sẽ xuất hiện tại đây.</p>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Bệnh nhân</th>
                                    <th>Ngày khám</th>
                                    <th>Khung giờ</th>
                                    <th>Lý do khám</th>
                                    <th>Trạng thái</th>
                                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((app) => (
                                    <tr key={app.Id}>
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{app.PatientName}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                                    {app.PatientGender} • {app.PatientDOB ? new Date(app.PatientDOB).getFullYear() : 'N/A'} (NS)
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} color="var(--text-muted)" />
                                                {new Date(app.AppointmentDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={14} color="var(--text-muted)" />
                                                {app.AppointmentTime}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {app.Reason || 'Không có lý do'}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(app.Status)}`}>
                                                {getStatusText(app.Status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {app.Status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.Id, 'approved')}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.3rem 0.6rem', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)', fontSize: '0.8rem' }}
                                                            title="Duyệt lịch"
                                                        >
                                                            <CheckCircle size={14} /> Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.Id, 'cancelled')}
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                            title="Hủy lịch"
                                                        >
                                                            <XCircle size={14} /> Hủy
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {app.Status === 'approved' && (
                                                    <Link
                                                        to={`/doctor/create-record`}
                                                        state={{ appointment: app }}
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                                    >
                                                        <FileText size={14} /> Tiến hành khám
                                                    </Link>
                                                )}

                                                {app.Status === 'completed' && (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        Đã khám xong
                                                    </span>
                                                )}
                                                
                                                {app.Status === 'cancelled' && (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                                                        Đã hủy bỏ
                                                    </span>
                                                )}
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

export default DoctorDashboard;
