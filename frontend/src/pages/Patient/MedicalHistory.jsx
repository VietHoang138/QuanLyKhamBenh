import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/api';
import { Clipboard, User, Heart, Sparkles, Calendar, BookOpen, AlertCircle } from 'lucide-react';

const MedicalHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (user?.Id) {
                try {
                    const res = await doctorService.getPatientHistory(user.Id);
                    setHistory(res.data);
                    if (res.data.length > 0) {
                        setSelectedRecord(res.data[0]); // Select first record by default
                    }
                } catch (err) {
                    console.error('Error fetching medical history:', err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchHistory();
    }, [user]);

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Bệnh Án & Đơn Thuốc</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Xem thông tin chẩn đoán từ bác sĩ, đơn thuốc được kê và các tóm tắt phân tích sức khỏe từ Trợ lý AI.
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Đang tải lịch sử bệnh án...
                </div>
            ) : history.length === 0 ? (
                <div className="glass" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    gap: '1rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <AlertCircle size={48} color="var(--text-muted)" />
                    <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>Chưa có hồ sơ bệnh án nào</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Hồ sơ bệnh án của bạn sẽ xuất hiện tại đây sau khi bác sĩ hoàn thành quy trình thăm khám và chẩn đoán.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* List of visits */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Danh sách các lần khám
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {history.map(record => (
                                <div
                                    key={record.Id}
                                    className={`glass fade-in`}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition-fast)',
                                        border: selectedRecord?.Id === record.Id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                        background: selectedRecord?.Id === record.Id ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255,255,255,0.01)'
                                    }}
                                    onClick={() => setSelectedRecord(record)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={12} />
                                            {new Date(record.CreatedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{record.Diagnosis}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bác sĩ: {record.DoctorName}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed view of selected visit */}
                    {selectedRecord && (
                        <div className="glass fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Chẩn đoán: {selectedRecord.Diagnosis}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Thực hiện bởi: <strong>{selectedRecord.DoctorName}</strong> ({selectedRecord.SpecializationName})
                                    </p>
                                </div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                                    Ngày khám: {new Date(selectedRecord.CreatedAt).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                
                                {/* Symptoms */}
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Heart size={16} /> Triệu chứng lâm sàng
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                                        {selectedRecord.Symptoms || 'Không ghi nhận'}
                                    </p>
                                </div>

                                {/* Prescription */}
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: '#3B82F6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Clipboard size={16} /> Đơn thuốc điều trị
                                    </h3>
                                    
                                    {selectedRecord.Drugs && selectedRecord.Drugs.length > 0 ? (
                                        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderLeft: '3px solid #3B82F6', borderRadius: 'var(--radius-sm)', padding: '1rem', overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '0.5rem 0.25rem', fontWeight: 600 }}>Tên thuốc</th>
                                                        <th style={{ padding: '0.5rem 0.25rem', fontWeight: 600 }}>Liều lượng</th>
                                                        <th style={{ padding: '0.5rem 0.25rem', fontWeight: 600 }}>Tần suất</th>
                                                        <th style={{ padding: '0.5rem 0.25rem', fontWeight: 600, textAlign: 'right' }}>Số ngày</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRecord.Drugs.map((drug, index) => (
                                                        <tr key={drug.Id || index} style={{ borderBottom: index === selectedRecord.Drugs.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: '#FFF' }}>{drug.DrugName}</td>
                                                            <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)' }}>{drug.Dosage || '—'}</td>
                                                            <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)' }}>{drug.Frequency || '—'}</td>
                                                            <td style={{ padding: '0.5rem 0.25rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{drug.Days ? `${drug.Days} ngày` : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #3B82F6', whiteSpace: 'pre-line' }}>
                                            {selectedRecord.Prescription || 'Không kê đơn thuốc'}
                                        </div>
                                    )}
                                </div>

                                {/* Doctor Notes */}
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <BookOpen size={16} /> Dặn dò từ bác sĩ
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                                        {selectedRecord.DoctorNotes || 'Nghỉ ngơi và theo dõi thêm.'}
                                    </p>
                                </div>

                                {/* AI Summary */}
                                {selectedRecord.AISummary && (
                                    <div className="ai-panel" style={{ marginTop: '1rem' }}>
                                        <div className="ai-header" style={{ marginBottom: '0.5rem' }}>
                                            <div className="ai-pulse"></div>
                                            <Sparkles size={18} color="violet" />
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#DDA0DD' }}>Tóm tắt y tế từ Trợ lý AI</h3>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4', fontStyle: 'italic' }}>
                                            {selectedRecord.AISummary}
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MedicalHistory;
