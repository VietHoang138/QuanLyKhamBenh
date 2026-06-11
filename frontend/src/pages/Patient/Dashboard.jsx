import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import { Calendar, Clock, User, AlertCircle, PlusCircle, ArrowRight, Bot } from 'lucide-react';

const PatientDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAppointments = async () => {
        try {
            const res = await appointmentService.getMyAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Đang chờ duyệt';
            case 'approved': return 'Đã phê duyệt';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Bảng Điều Khiển Bệnh Nhân</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Quản lý lịch hẹn khám bệnh và thông tin sức khỏe của bạn</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to="/patient/chat-ai" className="btn btn-secondary" style={{ border: '1px solid rgba(138, 43, 226, 0.4)' }}>
                        <Bot size={18} color="violet" />
                        <span>Tư vấn AI trước</span>
                    </Link>
                    <Link to="/patient/book" className="btn btn-primary">
                        <PlusCircle size={18} />
                        <span>Đặt lịch khám mới</span>
                    </Link>
                </div>
            </div>

            {/* AI Advisor Promo Panel */}
            <div className="ai-panel fade-in" style={{ marginBottom: '2rem' }}>
                <div className="ai-header">
                    <div className="ai-pulse"></div>
                    <Bot size={20} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Trợ Lý AI Tư Vấn Triệu Chứng</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Bạn đang cảm thấy không khỏe nhưng chưa biết nên khám khoa nào? Hãy trò chuyện với Trợ Lý AI của chúng tôi để được phân tích triệu chứng sơ bộ và nhận đề xuất chuyên khoa khám phù hợp.
                </p>
                <Link to="/patient/chat-ai" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8A2BE2 0%, #4FACFE 100%)', color: '#FFF', boxShadow: 'none', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
                    <span>Bắt đầu trò chuyện với AI</span>
                    <ArrowRight size={16} />
                </Link>
            </div>

            {/* Appointments Section */}
            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Lịch hẹn khám của tôi</h2>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Đang tải danh sách lịch khám...
                    </div>
                ) : appointments.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem 1rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        gap: '1rem'
                    }}>
                        <AlertCircle size={48} color="var(--text-muted)" />
                        <div>
                            <p style={{ fontWeight: 600, color: '#FFF' }}>Chưa có lịch hẹn khám nào</p>
                            <p style={{ fontSize: '0.9rem' }}>Bạn có thể nhấp vào nút "Đặt lịch khám mới" để đăng ký khám bệnh.</p>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Bác sĩ</th>
                                    <th>Chuyên khoa</th>
                                    <th>Ngày khám</th>
                                    <th>Khung giờ</th>
                                    <th>Lý do khám</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((app) => (
                                    <tr key={app.Id}>
                                        <td style={{ fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={16} color="var(--primary)" />
                                                {app.DoctorName}
                                            </div>
                                        </td>
                                        <td>{app.SpecializationName}</td>
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
                                            <span className={`badge badge-${app.Status}`}>
                                                {getStatusText(app.Status)}
                                            </span>
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

export default PatientDashboard;
