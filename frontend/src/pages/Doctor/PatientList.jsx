import React, { useState, useEffect } from 'react';
import { doctorService } from '../../services/api';
import { Users, User, Clipboard, Calendar, FileText, Activity, AlertCircle, Edit } from 'lucide-react';

const PatientList = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState('');

    // State cho chỉnh sửa thông tin lâm sàng của bác sĩ
    const [isEditingClinical, setIsEditingClinical] = useState(false);
    const [editForm, setEditForm] = useState({
        bloodType: '',
        emergencyContact: '',
        allergies: '',
        medicalHistory: ''
    });
    const [updatingClinical, setUpdatingClinical] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const fetchPatients = async () => {
        try {
            const res = await doctorService.getPatients();
            setPatients(res.data);
            if (res.data.length > 0) {
                setSelectedPatient(res.data[0]);
            }
        } catch (err) {
            console.error('Error fetching doctor patients:', err);
            setError('Không thể tải danh sách bệnh nhân.');
        } finally {
            setLoadingPatients(false);
        }
    };

    const fetchPatientHistory = async (patientId) => {
        setLoadingHistory(true);
        try {
            const res = await doctorService.getPatientHistory(patientId);
            setPatientHistory(res.data);
        } catch (err) {
            console.error('Error fetching patient medical history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSaveClinical = async () => {
        setUpdatingClinical(true);
        setUpdateError('');
        try {
            await doctorService.updatePatientClinicalInfo(selectedPatient.Id, {
                bloodType: editForm.bloodType,
                emergencyContact: editForm.emergencyContact,
                allergies: editForm.allergies,
                medicalHistory: editForm.medicalHistory
            });
            
            const updatedPatient = {
                ...selectedPatient,
                BloodType: editForm.bloodType,
                EmergencyContact: editForm.emergencyContact,
                Allergies: editForm.allergies,
                MedicalHistory: editForm.medicalHistory
            };
            
            setSelectedPatient(updatedPatient);
            setPatients(prev => prev.map(p => p.Id === selectedPatient.Id ? updatedPatient : p));
            setIsEditingClinical(false);
        } catch (err) {
            console.error('Error updating patient clinical info:', err);
            setUpdateError('Không thể cập nhật thông tin y khoa. Vui lòng thử lại.');
        } finally {
            setUpdatingClinical(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            fetchPatientHistory(selectedPatient.Id);
            setEditForm({
                bloodType: selectedPatient.BloodType || '',
                emergencyContact: selectedPatient.EmergencyContact || '',
                allergies: selectedPatient.Allergies || '',
                medicalHistory: selectedPatient.MedicalHistory || ''
            });
            setIsEditingClinical(false);
            setUpdateError('');
        }
    }, [selectedPatient]);

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Quản Lý Bệnh Nhân</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Danh sách các bệnh nhân từng đăng ký khám với bạn và tra cứu lịch sử bệnh án chi tiết của họ.
            </p>

            {error && (
                <div style={{ backgroundColor: 'var(--danger-bg)', color: '#EF4444', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {loadingPatients ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Đang tải danh sách bệnh nhân...
                </div>
            ) : patients.length === 0 ? (
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
                        <h3 style={{ marginBottom: '0.25rem' }}>Chưa có bệnh nhân nào</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Các bệnh nhân đã được phê duyệt và hoàn thành các ca khám bệnh với bạn sẽ xuất hiện tại đây.
                        </p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '2rem', alignItems: 'start' }}>
                    
                    {/* Patients list panel */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <Users size={18} color="var(--primary)" />
                            Danh sách Bệnh nhân ({patients.length})
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {patients.map(pat => (
                                <div
                                    key={pat.Id}
                                    className="glass fade-in"
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition-fast)',
                                        border: selectedPatient?.Id === pat.Id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                        background: selectedPatient?.Id === pat.Id ? 'rgba(0, 242, 254, 0.04)' : 'rgba(255,255,255,0.01)'
                                    }}
                                    onClick={() => setSelectedPatient(pat)}
                                >
                                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{pat.FullName}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span>Giới tính: {pat.Gender}</span>
                                        <span>Email: {pat.Email}</span>
                                        <span>SĐT: {pat.Phone || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medical history panel */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                        {selectedPatient ? (
                            <>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Lịch sử bệnh án: {selectedPatient.FullName}</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        NS: {selectedPatient.DateOfBirth ? new Date(selectedPatient.DateOfBirth).toLocaleDateString('vi-VN') : 'N/A'} • Địa chỉ: {selectedPatient.Address || 'N/A'}
                                    </p>
                                    
                                    {/* Bác sĩ có thể chỉnh sửa thông tin lâm sàng của bệnh nhân */}
                                    {!isEditingClinical ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Thông tin lâm sàng</span>
                                                <button
                                                    onClick={() => setIsEditingClinical(true)}
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                >
                                                    <Edit size={12} /> Chỉnh sửa
                                                </button>
                                            </div>
                                            
                                            {/* Giao diện xem thông tin */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.015)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-sm)',
                                                padding: '1rem'
                                            }}>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Mã bệnh nhân</span>
                                                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{selectedPatient.MaBenhNhan || 'N/A'}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nhóm máu</span>
                                                    <strong style={{ fontSize: '0.85rem', color: selectedPatient.BloodType ? '#10B981' : 'inherit' }}>
                                                        {selectedPatient.BloodType || 'Không xác định'}
                                                    </strong>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Liên hệ khẩn cấp</span>
                                                    <strong style={{ fontSize: '0.85rem' }}>{selectedPatient.EmergencyContact || 'N/A'}</strong>
                                                </div>
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Dị ứng</span>
                                                    <strong style={{ fontSize: '0.85rem', color: selectedPatient.Allergies ? '#EF4444' : 'inherit' }}>
                                                        {selectedPatient.Allergies || 'Không ghi nhận'}
                                                    </strong>
                                                </div>
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tiền sử bệnh án</span>
                                                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                        {selectedPatient.MedicalHistory || 'Không ghi nhận'}
                                                    </strong>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Giao diện sửa thông tin */
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--primary)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '1rem',
                                            marginTop: '1rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem'
                                        }}>
                                            <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: 0 }}>Chỉnh sửa thông tin y khoa</h4>
                                            
                                            {updateError && (
                                                <div style={{ color: '#EF4444', fontSize: '0.8rem', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                                                    {updateError}
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Nhóm máu</label>
                                                    <select
                                                        className="form-input"
                                                        style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', background: '#0D1322', color: '#FFF' }}
                                                        value={editForm.bloodType}
                                                        onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                                                    >
                                                        <option value="">--Chọn--</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B-">B-</option>
                                                        <option value="O+">O+</option>
                                                        <option value="O-">O-</option>
                                                        <option value="AB+">AB+</option>
                                                        <option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Liên hệ khẩn cấp</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem' }}
                                                        value={editForm.emergencyContact}
                                                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Dị ứng</label>
                                                <textarea
                                                    className="form-input"
                                                    rows="2"
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', background: '#0D1322', color: '#FFF', resize: 'vertical', fontFamily: 'inherit' }}
                                                    value={editForm.allergies}
                                                    onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tiền sử bệnh án</label>
                                                <textarea
                                                    className="form-input"
                                                    rows="3"
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem', background: '#0D1322', color: '#FFF', resize: 'vertical', fontFamily: 'inherit' }}
                                                    value={editForm.medicalHistory}
                                                    onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                <button
                                                    onClick={() => setIsEditingClinical(false)}
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                                    disabled={updatingClinical}
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleSaveClinical}
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                                    disabled={updatingClinical}
                                                >
                                                    {updatingClinical ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {loadingHistory ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Đang tải bệnh án cũ...
                                    </div>
                                ) : patientHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                                        Bệnh nhân này chưa có ghi chép bệnh án nào trên hệ thống.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {patientHistory.map(record => (
                                            <div key={record.Id} className="glass fade-in" style={{ padding: '1.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                    <span style={{ fontWeight: 700, color: '#FFF' }}>Chẩn đoán: {record.Diagnosis}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Calendar size={12} />
                                                        {new Date(record.CreatedAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                                    <p><strong>Triệu chứng:</strong> {record.Symptoms || 'Không ghi nhận'}</p>
                                                    <p><strong>Đơn thuốc:</strong> {record.Prescription || 'Không kê đơn'}</p>
                                                    <p><strong>Bác sĩ khám:</strong> {record.DoctorName} ({record.SpecializationName})</p>
                                                    {record.DoctorNotes && <p><strong>Ghi chú:</strong> {record.DoctorNotes}</p>}
                                                    {record.AISummary && (
                                                        <div style={{ background: 'rgba(138,43,226,0.06)', border: '1px solid rgba(138,43,226,0.15)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                            <strong style={{ color: '#DDA0DD', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                                                <Activity size={12} /> Tóm tắt y khoa (AI)
                                                            </strong>
                                                            <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>{record.AISummary}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
                                Chọn một bệnh nhân bên danh sách để xem bệnh án.
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default PatientList;
