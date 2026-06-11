import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doctorService, aiService } from '../../services/api';
import { FileText, User, Clipboard, BookOpen, Heart, Sparkles, Bot, AlertTriangle, ArrowLeft } from 'lucide-react';

const CreateRecord = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const appointment = location.state?.appointment;

    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [doctorNotes, setDoctorNotes] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    
    const [aiLoading, setAiLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!appointment) {
            setError('Không tìm thấy thông tin lịch khám hợp lệ. Vui lòng quay lại bảng điều khiển.');
        } else {
            setSymptoms(appointment.Reason || '');
        }
    }, [appointment]);

    const handleAiSummarize = async () => {
        if (!diagnosis) {
            setError('Vui lòng nhập chẩn đoán bệnh trước khi yêu cầu AI tóm tắt.');
            return;
        }
        setError('');
        setAiLoading(true);
        try {
            const res = await aiService.summarizeRecord({
                diagnosis,
                symptoms,
                doctor_notes: doctorNotes || 'Không có ghi chú thêm.',
                prescription: prescription || 'Không kê đơn.'
            });
            setAiSummary(res.data.summary);
        } catch (err) {
            console.error('AI Summarization failed:', err);
            setError('Không thể kết nối với dịch vụ AI để tóm tắt bệnh án.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!diagnosis.trim()) {
            setError('Vui lòng nhập chẩn đoán của bác sĩ.');
            return;
        }

        setSubmitting(true);
        try {
            await doctorService.createMedicalRecord({
                appointmentId: appointment.Id,
                patientId: appointment.PatientId,
                symptoms,
                diagnosis,
                prescription,
                doctorNotes,
                aiSummary
            });
            setSuccess('Đã lưu bệnh án và kết thúc ca khám bệnh thành công!');
            setTimeout(() => {
                navigate('/doctor');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu bệnh án.');
            setSubmitting(false);
        }
    };

    if (!appointment) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
                <button onClick={() => navigate('/doctor')} className="btn btn-secondary">
                    Quay lại Bảng điều khiển
                </button>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/doctor')} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 style={{ marginBottom: '0.1rem', fontSize: '1.5rem' }}>Lập Bệnh Án & Kê Đơn</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tiến hành khám cho bệnh nhân {appointment.PatientName}</p>
                </div>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Form chẩn đoán */}
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <FileText size={20} color="var(--primary)" />
                        Nội dung khám bệnh
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Triệu chứng lâm sàng */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="symptoms">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Heart size={14} /> Triệu chứng lâm sàng
                                </span>
                            </label>
                            <textarea
                                id="symptoms"
                                className="form-input"
                                rows="3"
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                placeholder="Ghi nhận triệu chứng người bệnh khai báo..."
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        {/* Chẩn đoán */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="diagnosis">Chẩn đoán bệnh lý *</label>
                            <input
                                type="text"
                                id="diagnosis"
                                className="form-input"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="Ví dụ: Viêm họng cấp tính, Đau dạ dày do HP..."
                                required
                            />
                        </div>

                        {/* Đơn thuốc */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="prescription">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clipboard size={14} /> Đơn thuốc điều trị
                                </span>
                            </label>
                            <textarea
                                id="prescription"
                                className="form-input"
                                rows="4"
                                value={prescription}
                                onChange={(e) => setPrescription(e.target.value)}
                                placeholder="Tên thuốc, liều lượng và cách dùng (Ví dụ: Amoxicillin 500mg x 10 viên, uống 2 viên/ngày)..."
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        {/* Ghi chú & dặn dò */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="doctorNotes">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <BookOpen size={14} /> Lời khuyên & Dặn dò
                                </span>
                            </label>
                            <textarea
                                id="doctorNotes"
                                className="form-input"
                                rows="3"
                                value={doctorNotes}
                                onChange={(e) => setDoctorNotes(e.target.value)}
                                placeholder="Chế độ ăn uống nghỉ ngơi, hẹn ngày tái khám..."
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.85rem', marginTop: '1.5rem' }}
                            disabled={submitting}
                        >
                            {submitting ? 'Đang hoàn tất ca khám...' : 'Lưu Bệnh Án & Kết Thúc Khám'}
                        </button>
                    </form>
                </div>

                {/* AI Assistant Section */}
                <div>
                    {/* Patient Information Summary */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} color="var(--primary)" />
                            Thông tin bệnh nhân
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <p><strong>Họ và tên:</strong> {appointment.PatientName}</p>
                            <p><strong>Giới tính:</strong> {appointment.PatientGender}</p>
                            <p><strong>Ngày sinh:</strong> {appointment.PatientDOB ? new Date(appointment.PatientDOB).toLocaleDateString('vi-VN') : 'Không rõ'}</p>
                            <p><strong>Liên hệ:</strong> {appointment.PatientPhone || 'N/A'}</p>
                        </div>
                    </div>

                    {/* AI Summarizer Panel */}
                    <div className="ai-panel">
                        <div className="ai-header">
                            <div className="ai-pulse"></div>
                            <Bot size={20} />
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#DDA0DD' }}>AI Tóm Tắt Bệnh Án</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                            Trợ lý AI hỗ trợ tóm tắt lại các chẩn đoán, thuốc và dặn dò của bác sĩ thành một văn bản ngắn gọn, trực quan nhất cho bệnh nhân dễ nắm bắt.
                        </p>

                        <button
                            onClick={handleAiSummarize}
                            className="btn"
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--secondary) 100%)',
                                color: '#FFF',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                padding: '0.6rem'
                            }}
                            disabled={aiLoading}
                        >
                            <Sparkles size={14} />
                            {aiLoading ? 'Đang tóm tắt...' : 'AI Tóm Tắt Bệnh Án'}
                        </button>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Kết quả tóm tắt từ AI</label>
                            <textarea
                                className="form-input"
                                rows="5"
                                value={aiSummary}
                                onChange={(e) => setAiSummary(e.target.value)}
                                placeholder="Kết quả tóm tắt từ AI sẽ hiển thị ở đây (Bác sĩ có thể chỉnh sửa lại nếu cần)..."
                                style={{ resize: 'none', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', lineHeight: '1.4' }}
                            ></textarea>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CreateRecord;
