import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/api';
import { 
    Calendar, Clock, User, Clipboard, MessageSquare, Bot, 
    PlusCircle, HeartPulse, AlertCircle, ArrowRight, Activity
} from 'lucide-react';

const PatientHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [upcomingApp, setUpcomingApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        // Set greeting date/time
        const formatGreetingDate = () => {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            setCurrentTime(now.toLocaleDateString('vi-VN', options));
        };
        formatGreetingDate();

        // Fetch nearest upcoming appointment
        const fetchUpcomingAppointment = async () => {
            try {
                const res = await appointmentService.getMyAppointments();
                const myAppointments = res.data || [];
                
                // Filter pending or approved appointments
                const activeApps = myAppointments.filter(app => 
                    app.Status === 'pending' || app.Status === 'approved'
                );

                if (activeApps.length > 0) {
                    // Sort by date and time to find the closest one
                    activeApps.sort((a, b) => {
                        const dateA = new Date(`${a.AppointmentDate.split('T')[0]}T${a.AppointmentTime}`);
                        const dateB = new Date(`${b.AppointmentDate.split('T')[0]}T${b.AppointmentTime}`);
                        return dateA - dateB;
                    });
                    setUpcomingApp(activeApps[0]);
                }
            } catch (err) {
                console.error('Error fetching upcoming appointment:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcomingAppointment();
    }, []);

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ duyệt';
            case 'approved': return 'Đã duyệt';
            default: return status;
        }
    };

    const quickActions = [
        {
            title: 'Đặt Lịch Khám',
            desc: 'Đặt lịch hẹn với bác sĩ chuyên khoa phù hợp',
            icon: <PlusCircle size={28} color="var(--primary)" />,
            link: '/patient/book',
            gradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(79, 172, 254, 0.05) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.2)'
        },
        {
            title: 'Lịch Khám Của Tôi',
            desc: 'Quản lý trạng thái và danh sách lịch hẹn khám',
            icon: <Calendar size={28} color="#4FACFE" />,
            link: '/patient/appointments',
            gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(20, 27, 45, 0.4) 100%)',
            border: '1px solid rgba(79, 172, 254, 0.2)'
        },
        {
            title: 'Hồ Sơ Bệnh Án',
            desc: 'Xem lịch sử khám bệnh và toa thuốc điều trị',
            icon: <Clipboard size={28} color="#10B981" />,
            link: '/patient/history',
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 27, 45, 0.4) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
        },
        {
            title: 'Tư Vấn AI Thông Minh',
            desc: 'Phân tích triệu chứng sơ bộ qua chatbot AI',
            icon: <Bot size={28} color="violet" />,
            link: '/patient/chat-ai',
            gradient: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(20, 27, 45, 0.4) 100%)',
            border: '1px solid rgba(138, 43, 226, 0.3)',
            isSpecial: true
        },
        {
            title: 'Hỏi Đáp Bác Sĩ',
            desc: 'Trò chuyện và nhận lời khuyên trực tiếp từ bác sĩ',
            icon: <MessageSquare size={28} color="#3B82F6" />,
            link: '/patient/chat-doctor',
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(20, 27, 45, 0.4) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
        },
        {
            title: 'Thông Tin Cá Nhân',
            desc: 'Cập nhật thông tin liên lạc và tiểu sử y tế',
            icon: <User size={28} color="#F59E0B" />,
            link: '/patient/profile',
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 27, 45, 0.4) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
        }
    ];

    const healthTips = [
        { title: 'Chế độ ăn uống', text: 'Uống ít nhất 2 lít nước mỗi ngày giúp tăng cường trao đổi chất và thải độc cho cơ thể.' },
        { title: 'Hoạt động thể chất', text: 'Dành 30 phút đi bộ nhanh hoặc vận động nhẹ nhàng mỗi ngày để cải thiện sức khỏe tim mạch.' },
        { title: 'Chất lượng giấc ngủ', text: 'Ngủ đủ từ 7 - 8 tiếng mỗi ngày để cơ thể có thời gian tự chữa lành và tái tạo năng lượng.' },
        { title: 'Kiểm tra sức khỏe', text: 'Khám sức khỏe tổng quát định kỳ mỗi 6 tháng để phát hiện sớm các nguy cơ tiềm ẩn.' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Hero Section / Greeting Banner */}
            <div className="glass fade-in" style={{
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.95) 0%, rgba(11, 15, 25, 0.95) 100%)',
                border: '1px solid rgba(0, 242, 254, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px 0 rgba(0, 242, 254, 0.05)'
            }}>
                {/* Decorative background light */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,242,254,0.15) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-80px',
                    left: '-80px',
                    width: '250px',
                    height: '250px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(138,43,226,0.1) 0%, rgba(0,0,0,0) 70%)',
                    pointerEvents: 'none'
                }}></div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--primary)', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: '0.5rem'
                    }}>
                        {currentTime}
                    </span>
                    <h1 style={{ 
                        fontSize: '2.25rem', 
                        fontWeight: 800, 
                        marginBottom: '0.75rem',
                        background: 'linear-gradient(135deg, #FFF 0%, var(--text-secondary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Xin chào, {user?.FullName || 'Bạn'}! 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', lineHeight: 1.6 }}>
                        Chào mừng bạn quay lại với hệ thống **MedCare Pro**. Bạn đang cảm thấy như thế nào hôm nay? Hãy chọn một tính năng bên dưới để bắt đầu chăm sóc sức khỏe nhé.
                    </p>
                </div>
            </div>

            {/* Quick Action Cards Grid */}
            <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color="var(--primary)" />
                    <span>Dịch Vụ Nhanh</span>
                </h2>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {quickActions.map((action, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => navigate(action.link)}
                            className="glass" 
                            style={{
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                background: action.gradient,
                                border: action.border,
                                display: 'flex',
                                gap: '1rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: action.isSpecial ? '0 4px 20px rgba(138, 43, 226, 0.15)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = action.isSpecial ? 'rgba(138, 43, 226, 0.6)' : 'var(--primary)';
                                e.currentTarget.style.boxShadow = action.isSpecial 
                                    ? '0 8px 30px rgba(138, 43, 226, 0.3)' 
                                    : '0 8px 25px rgba(0, 242, 254, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = action.isSpecial ? 'rgba(138, 43, 226, 0.3)' : 'var(--border-color)';
                                e.currentTarget.style.boxShadow = action.isSpecial ? '0 4px 20px rgba(138, 43, 226, 0.15)' : 'none';
                            }}
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {action.icon}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
                                    {action.title}
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                                    {action.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Split Section: Appointment Check & Health Tips */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem'
            }}>
                
                {/* Left Column: Upcoming Appointment & AI Advisor Banner */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Upcoming Appointment */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} color="var(--primary)" />
                            <span>Lịch Hẹn Sắp Tới</span>
                        </h2>

                        {loading ? (
                            <div style={{ padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Đang kiểm tra lịch khám...
                            </div>
                        ) : upcomingApp ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ 
                                    background: 'rgba(255, 255, 255, 0.02)', 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '1.25rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={18} color="var(--primary)" />
                                            <span style={{ fontWeight: 700, color: '#FFF', fontSize: '1.05rem' }}>
                                                {upcomingApp.DoctorName}
                                            </span>
                                        </div>
                                        <span className={`badge badge-${upcomingApp.Status}`}>
                                            {getStatusText(upcomingApp.Status)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Calendar size={14} color="var(--text-muted)" />
                                            <span>{new Date(upcomingApp.AppointmentDate).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Clock size={14} color="var(--text-muted)" />
                                            <span>{upcomingApp.AppointmentTime}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Chuyên khoa: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{upcomingApp.SpecializationName}</span>
                                        </p>
                                    </div>
                                </div>

                                <Link to="/patient/appointments" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem' }}>
                                    <span>Xem tất cả lịch hẹn</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem 1rem',
                                color: 'var(--text-secondary)',
                                textAlign: 'center',
                                gap: '1rem',
                                background: 'rgba(255, 255, 255, 0.01)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px dotted var(--border-color)'
                            }}>
                                <AlertCircle size={40} color="var(--text-muted)" />
                                <div>
                                    <p style={{ fontWeight: 600, color: '#FFF', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                        Không có lịch khám sắp tới
                                    </p>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Bạn chưa đăng ký lịch khám nào. Hãy đặt lịch khám mới khi có nhu cầu nhé!
                                    </p>
                                </div>
                                <Link to="/patient/book" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                                    <span>Đặt lịch ngay</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* AI Symptom Advisor Quick Access Panel */}
                    <div className="ai-panel" style={{
                        border: '1px solid rgba(138, 43, 226, 0.3)',
                        background: 'radial-gradient(circle at top right, rgba(138, 43, 226, 0.12) 0%, rgba(20, 27, 45, 0.7) 100%)',
                        boxShadow: '0 4px 25px rgba(138, 43, 226, 0.05)'
                    }}>
                        <div className="ai-header">
                            <div className="ai-pulse"></div>
                            <Bot size={20} color="violet" />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#DDA0DD' }}>Trợ Lý AI Tư Vấn Sức Khỏe</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                            Bạn gặp triệu chứng khó chịu nhưng chưa rõ nguyên nhân hoặc chuyên khoa phù hợp? Trò chuyện ngay với AI của chúng tôi để nhận chẩn đoán sơ bộ.
                        </p>
                        <Link to="/patient/chat-ai" className="btn btn-primary" style={{ 
                            background: 'linear-gradient(135deg, #8A2BE2 0%, #4FACFE 100%)', 
                            color: '#FFF', 
                            boxShadow: 'none', 
                            padding: '0.6rem 1.2rem', 
                            fontSize: '0.9rem' 
                        }}>
                            <span>Tư vấn ngay với AI</span>
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                </div>

                {/* Right Column: Health Tips & Info */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HeartPulse size={18} color="var(--primary)" />
                        <span>Lời Khuyên Sức Khỏe 24/7</span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {healthTips.map((tip, idx) => (
                            <div key={idx} style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderLeft: '3px solid var(--primary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF' }}>
                                    {tip.title}
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {tip.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PatientHome;
