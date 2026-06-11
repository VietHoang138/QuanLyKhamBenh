import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Users, User, Calendar, BarChart2, ShieldCheck, HeartPulse, PieChart } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminService.getStats();
                setStats(res.data);
            } catch (err) {
                console.error('Error fetching admin statistics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Đang tải dữ liệu thống kê...
            </div>
        );
    }

    if (!stats) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Không thể tải dữ liệu thống kê của hệ thống.
            </div>
        );
    }

    const { summary, appointmentStatusCount, specialtyDistribution } = stats;

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Hệ Thống Thống Kê & Báo Cáo</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Tổng quan các hoạt động thăm khám, số lượng người dùng và phân bổ chuyên khoa trong toàn phòng khám.
            </p>

            {/* Stat Cards Grid */}
            <div className="dashboard-grid">
                <div className="stat-card glass fade-in">
                    <div className="stat-header">
                        <span className="stat-title">Tổng Bệnh Nhân</span>
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 242, 254, 0.15)' }}>
                            <Users size={20} color="var(--primary)" />
                        </div>
                    </div>
                    <div className="stat-value">{summary.totalPatients}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Đăng ký tài khoản hệ thống</p>
                </div>

                <div className="stat-card glass fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-header">
                        <span className="stat-title">Số Lượng Bác Sĩ</span>
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(138, 43, 226, 0.15)' }}>
                            <ShieldCheck size={20} color="violet" />
                        </div>
                    </div>
                    <div className="stat-value">{summary.totalDoctors}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Hoạt động theo chuyên khoa</p>
                </div>

                <div className="stat-card glass fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-header">
                        <span className="stat-title">Tổng Lịch Hẹn Khám</span>
                        <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                            <Calendar size={20} color="#3B82F6" />
                        </div>
                    </div>
                    <div className="stat-value">{summary.totalAppointments}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Tổng số lượt đặt lịch trên app</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginTop: '2rem' }}>
                
                {/* Appointment Status Counts */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart size={18} color="var(--primary)" />
                        Phân Loại Trạng Thái Lịch Khám
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--warning)' }}>Đang chờ duyệt</span>
                                <span style={{ fontWeight: 700 }}>{appointmentStatusCount.pending}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ height: '100%', background: 'var(--warning)', width: `${summary.totalAppointments ? (appointmentStatusCount.pending / summary.totalAppointments) * 100 : 0}%`, borderRadius: '3px' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--info)' }}>Đã phê duyệt</span>
                                <span style={{ fontWeight: 700 }}>{appointmentStatusCount.approved}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ height: '100%', background: 'var(--info)', width: `${summary.totalAppointments ? (appointmentStatusCount.approved / summary.totalAppointments) * 100 : 0}%`, borderRadius: '3px' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--success)' }}>Đã khám xong (Hoàn thành)</span>
                                <span style={{ fontWeight: 700 }}>{appointmentStatusCount.completed}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ height: '100%', background: 'var(--success)', width: `${summary.totalAppointments ? (appointmentStatusCount.completed / summary.totalAppointments) * 100 : 0}%`, borderRadius: '3px' }}></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                                <span style={{ color: 'var(--danger)' }}>Đã hủy lịch</span>
                                <span style={{ fontWeight: 700 }}>{appointmentStatusCount.cancelled}</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                <div style={{ height: '100%', background: 'var(--danger)', width: `${summary.totalAppointments ? (appointmentStatusCount.cancelled / summary.totalAppointments) * 100 : 0}%`, borderRadius: '3px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specialties appointment distribution */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={18} color="violet" />
                        Tần Suất Khám Theo Chuyên Khoa
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {specialtyDistribution.map((row, index) => (
                            <div key={row.SpecialtyName}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    <span>{row.SpecialtyName}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.AppointmentCount} ca khám</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
                                        width: `${summary.totalAppointments ? (row.AppointmentCount / summary.totalAppointments) * 100 : 0}%`,
                                        borderRadius: '3px'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
