import React, { useState, useEffect } from 'react';
import { adminService, appointmentService } from '../../services/api';
import { ShieldAlert, Plus, Edit, X, Save, KeyRound, Mail, User, Phone, MapPin, Calendar, HeartPulse } from 'lucide-react';

const DoctorManagement = () => {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: 'Nam',
        specializationId: ''
    });

    const fetchData = async () => {
        try {
            const docRes = await appointmentService.getDoctors();
            setDoctors(docRes.data);
            
            const specRes = await appointmentService.getSpecializations();
            setSpecialties(specRes.data);
            if (specRes.data.length > 0 && !formData.specializationId) {
                setFormData(prev => ({ ...prev, specializationId: specRes.data[0].Id.toString() }));
            }
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh sách bác sĩ/chuyên khoa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleOpenAdd = () => {
        setEditingDoctor(null);
        setFormData({
            email: '',
            password: '',
            fullName: '',
            phone: '',
            address: '',
            dateOfBirth: '',
            gender: 'Nam',
            specializationId: specialties[0]?.Id.toString() || ''
        });
        setShowAddForm(true);
    };

    const handleOpenEdit = (doc) => {
        setEditingDoctor(doc);
        setFormData({
            email: doc.Email,
            password: '••••••••', // Placeholder
            fullName: doc.FullName,
            phone: doc.Phone || '',
            address: doc.Address || '',
            dateOfBirth: doc.DateOfBirth ? new Date(doc.DateOfBirth).toISOString().split('T')[0] : '',
            gender: doc.Gender || 'Nam',
            specializationId: doc.SpecializationId.toString()
        });
        setShowAddForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (editingDoctor) {
            // Update Doctor (exclude email/password as they are managed differently or locked in edit)
            try {
                await adminService.updateDoctor(editingDoctor.Id, {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    address: formData.address,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    specializationId: formData.specializationId
                });
                setSuccess('Cập nhật thông tin bác sĩ thành công!');
                setShowAddForm(false);
                fetchData();
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể cập nhật thông tin bác sĩ.');
            }
        } else {
            // Create Doctor
            try {
                await adminService.addDoctor({
                    ...formData,
                    specializationId: formData.specializationId
                });
                setSuccess('Tạo tài khoản bác sĩ mới thành công!');
                setShowAddForm(false);
                fetchData();
            } catch (err) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm bác sĩ.');
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Quản Lý Bác Sĩ</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Thêm bác sĩ mới, cập nhật hồ sơ chuyên môn và quản lý lịch khám.</p>
                </div>
                {!showAddForm && (
                    <button onClick={handleOpenAdd} className="btn btn-primary">
                        <Plus size={18} />
                        <span>Thêm Bác sĩ Mới</span>
                    </button>
                )}
            </div>

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

            {showAddForm ? (
                <div className="glass fade-in" style={{ padding: '2.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>
                            {editingDoctor ? `Chỉnh sửa bác sĩ: ${editingDoctor.FullName}` : 'Đăng ký tài khoản bác sĩ mới'}
                        </h2>
                        <button onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={!!editingDoctor}
                                    style={editingDoctor ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                />
                            </div>

                            {/* Password */}
                            {!editingDoctor && (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="password">Mật khẩu *</label>
                                    <input
                                        type="password"
                                        id="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="fullName">Họ và Tên *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    className="form-input"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Specialty selection */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="specializationId">Chuyên khoa chuyên môn *</label>
                                <select
                                    id="specializationId"
                                    className="form-input"
                                    value={formData.specializationId}
                                    onChange={handleChange}
                                    style={{ background: '#0D1322', color: '#FFF' }}
                                    required
                                >
                                    {specialties.map(spec => (
                                        <option key={spec.Id} value={spec.Id}>{spec.Name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Phone */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="phone">Số điện thoại</label>
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
                                <label className="form-label" htmlFor="dateOfBirth">Ngày sinh</label>
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
                                <label className="form-label" htmlFor="gender">Giới tính</label>
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
                                <label className="form-label" htmlFor="address">Địa chỉ</label>
                                <input
                                    type="text"
                                    id="address"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                <Save size={16} />
                                <span>{editingDoctor ? 'Lưu Thay Đổi' : 'Thêm Bác Sĩ'}</span>
                            </button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                                Hủy bỏ
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HeartPulse size={20} color="var(--primary)" />
                        Đội ngũ bác sĩ phòng khám ({doctors.length})
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            Đang tải danh sách bác sĩ...
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Họ và tên</th>
                                        <th>Chuyên khoa</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Giới tính</th>
                                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.map(doc => (
                                        <tr key={doc.Id}>
                                            <td style={{ fontWeight: 600 }}>{doc.FullName}</td>
                                            <td>
                                                <span className="badge badge-approved" style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--primary)' }}>
                                                    {doc.SpecializationName}
                                                </span>
                                            </td>
                                            <td>{doc.Email}</td>
                                            <td>{doc.Phone || '-'}</td>
                                            <td>{doc.Gender}</td>
                                            <td>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleOpenEdit(doc)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit size={14} />
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
            )}
        </div>
    );
};

export default DoctorManagement;
