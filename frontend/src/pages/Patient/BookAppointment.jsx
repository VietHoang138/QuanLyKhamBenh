import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService, aiService } from '../../services/api';
import { Calendar, User, HeartPulse, Sparkles, Bot, ChevronRight, Check } from 'lucide-react';

const BookAppointment = () => {
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    
    // Form States
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [reason, setReason] = useState('');
    
    // AI States
    const [aiSymptomsInput, setAiSymptomsInput] = useState('');
    const [aiSuggestedSpec, setAiSuggestedSpec] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const navigate = useNavigate();

    const timeSlots = [
        '08:00 - 09:00',
        '09:00 - 10:00',
        '10:00 - 11:00',
        '14:00 - 15:00',
        '15:00 - 16:00',
        '16:00 - 17:00'
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const specRes = await appointmentService.getSpecializations();
                setSpecialties(specRes.data);
                
                // Get all doctors initially
                const docRes = await appointmentService.getDoctors();
                setDoctors(docRes.data);
            } catch (err) {
                console.error(err);
                setError('Không thể tải danh sách chuyên khoa/bác sĩ.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Filter doctors when specialty changes
    useEffect(() => {
        const fetchFilteredDoctors = async () => {
            if (selectedSpecialty) {
                try {
                    const docRes = await appointmentService.getDoctors(selectedSpecialty);
                    setDoctors(docRes.data);
                    setSelectedDoctor(''); // reset doctor selection
                } catch (err) {
                    console.error(err);
                }
            } else {
                // If no specialty selected, fetch all doctors
                try {
                    const docRes = await appointmentService.getDoctors();
                    setDoctors(docRes.data);
                } catch (err) {}
            }
        };
        fetchFilteredDoctors();
    }, [selectedSpecialty]);

    const handleSuggestSpecialty = async () => {
        if (!aiSymptomsInput.trim()) return;
        setAiLoading(true);
        setAiSuggestedSpec(null);
        setError('');
        
        try {
            const res = await aiService.suggestSpecialty(aiSymptomsInput);
            setAiSuggestedSpec(res.data);
        } catch (err) {
            console.error('AI Suggestion error:', err);
            setError('Không thể kết nối với dịch vụ AI.');
        } finally {
            setAiLoading(false);
        }
    };

    const applyAiSuggestion = () => {
        if (!aiSuggestedSpec) return;
        // Find specialty by name
        const matched = specialties.find(s => s.Name.toLowerCase() === aiSuggestedSpec.suggested_specialty.toLowerCase());
        if (matched) {
            setSelectedSpecialty(matched.Id.toString());
            // Pre-fill reason with user's symptoms
            setReason(aiSymptomsInput);
            setSuccess(`Đã áp dụng chuyên khoa: ${matched.Name}`);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(`Không tìm thấy chuyên khoa '${aiSuggestedSpec.suggested_specialty}' trên hệ thống.`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedDoctor || !appointmentDate || !selectedSlot) {
            setError('Vui lòng chọn đầy đủ Bác sĩ, Ngày khám và Khung giờ khám.');
            return;
        }

        setSubmitting(true);
        try {
            await appointmentService.book({
                doctorId: Number(selectedDoctor),
                appointmentDate,
                appointmentTime: selectedSlot,
                reason
            });
            setSuccess('Đặt lịch hẹn khám thành công! Đang quay lại trang chủ...');
            setTimeout(() => {
                navigate('/patient');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình đặt lịch.');
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Đặt Lịch Khám Mới</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Điền thông tin đặt lịch hẹn khám hoặc dùng Trợ lý AI phân tích để chọn chuyên khoa phù hợp.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Form đặt lịch */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} color="var(--primary)" />
                        Thông tin đăng ký khám
                    </h2>

                    {error && (
                        <div style={{ backgroundColor: 'var(--danger-bg)', color: '#EF4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* 1. Chọn chuyên khoa */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="specialty">Chuyên khoa khám *</label>
                            <select
                                id="specialty"
                                className="form-input"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                                style={{ background: '#0D1322', color: '#FFF' }}
                                required
                            >
                                <option value="">-- Chọn chuyên khoa khám --</option>
                                {specialties.map(spec => (
                                    <option key={spec.Id} value={spec.Id}>{spec.Name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Chọn bác sĩ */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor">Bác sĩ điều trị *</label>
                            <select
                                id="doctor"
                                className="form-input"
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                style={{ background: '#0D1322', color: '#FFF' }}
                                required
                                disabled={doctors.length === 0}
                            >
                                <option value="">-- Chọn bác sĩ --</option>
                                {doctors.map(doc => (
                                    <option key={doc.Id} value={doc.Id}>
                                        {doc.FullName} ({doc.SpecializationName})
                                    </option>
                                ))}
                            </select>
                            {doctors.length === 0 && selectedSpecialty && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Hiện chuyên khoa này chưa có bác sĩ trực.</p>
                            )}
                        </div>

                        {/* 3. Chọn ngày */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="date">Ngày khám bệnh *</label>
                            <input
                                type="date"
                                id="date"
                                className="form-input"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // Cannot book past dates
                                required
                            />
                        </div>

                        {/* 4. Khung giờ khám */}
                        <div className="form-group">
                            <label className="form-label">Khung giờ khám bệnh *</label>
                            <div className="slot-grid">
                                {timeSlots.map(slot => (
                                    <div
                                        key={slot}
                                        className={`slot-item ${selectedSlot === slot ? 'selected' : ''}`}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        {slot}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Lý do khám */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="reason">Lý do khám / Triệu chứng gặp phải</label>
                            <textarea
                                id="reason"
                                className="form-input"
                                rows="3"
                                placeholder="Mô tả triệu chứng của bạn để bác sĩ nắm rõ hơn..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
                            disabled={submitting}
                        >
                            {submitting ? 'Đang gửi đăng ký...' : 'Xác Nhận Đặt Lịch'}
                        </button>
                    </form>
                </div>

                {/* Gợi ý chuyên khoa bằng AI */}
                <div className="ai-panel fade-in">
                    <div className="ai-header" style={{ marginBottom: '1.25rem' }}>
                        <div className="ai-pulse"></div>
                        <Bot size={22} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Tư vấn Chuyên khoa từ AI</h2>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Nhập các triệu chứng bạn đang gặp phải (ví dụ: "tôi bị ho kéo dài, sốt nhẹ và đau họng"), AI sẽ gợi ý chuyên khoa phù hợp giúp bạn.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Triệu chứng của bạn</label>
                        <textarea
                            className="form-input"
                            rows="4"
                            placeholder="Ví dụ: tôi cảm thấy tức ngực khi thở mạnh và mệt mỏi..."
                            value={aiSymptomsInput}
                            onChange={(e) => setAiSymptomsInput(e.target.value)}
                            style={{ resize: 'none', background: 'rgba(0,0,0,0.2)' }}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleSuggestSpecialty}
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--secondary) 100%)',
                            color: '#FFF',
                            marginBottom: '1.5rem'
                        }}
                        disabled={aiLoading || !aiSymptomsInput.trim()}
                    >
                        <Sparkles size={16} />
                        {aiLoading ? 'Đang phân tích...' : 'AI Gợi Ý Chuyên Khoa'}
                    </button>

                    {aiSuggestedSpec && (
                        <div className="ai-result-box fade-in">
                            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Sparkles size={16} />
                                Gợi ý chuyên khoa: {aiSuggestedSpec.suggested_specialty}
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                                <strong>Lý do gợi ý:</strong> {aiSuggestedSpec.reason}
                            </p>
                            
                            <button
                                onClick={applyAiSuggestion}
                                className="btn btn-secondary"
                                style={{
                                    width: '100%',
                                    fontSize: '0.85rem',
                                    padding: '0.5rem',
                                    borderColor: 'var(--primary)',
                                    color: 'var(--primary)'
                                }}
                            >
                                <Check size={14} />
                                Áp dụng chuyên khoa này
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BookAppointment;
