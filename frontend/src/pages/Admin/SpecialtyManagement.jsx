import React, { useState, useEffect } from 'react';
import { adminService, appointmentService } from '../../services/api';
import { HeartPulse, Plus, Edit, Trash2, X, Save, Clipboard, AlertTriangle } from 'lucide-react';

const SpecialtyManagement = () => {
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const fetchSpecialties = async () => {
        try {
            const res = await appointmentService.getSpecializations();
            setSpecialties(res.data);
        } catch (err) {
            console.error('Error fetching specialties:', err);
            setError('Không thể tải danh sách chuyên khoa.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const handleOpenAdd = () => {
        setEditingSpecialty(null);
        setName('');
        setDescription('');
        setShowForm(true);
    };

    const handleOpenEdit = (spec) => {
        setEditingSpecialty(spec);
        setName(spec.Name);
        setDescription(spec.Description || '');
        setShowForm(true);
    };

    const handleDelete = async (id, specName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa chuyên khoa "${specName}" không?`)) {
            return;
        }

        setError('');
        setSuccess('');
        try {
            await adminService.deleteSpecialty(id);
            setSuccess(`Đã xóa chuyên khoa "${specName}" thành công.`);
            fetchSpecialties();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xóa chuyên khoa. Đảm bảo chuyên khoa không có bác sĩ trực thuộc.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Vui lòng nhập tên chuyên khoa.');
            return;
        }

        if (editingSpecialty) {
            // Edit
            try {
                await adminService.updateSpecialty(editingSpecialty.Id, { name, description });
                setSuccess(`Đã cập nhật chuyên khoa "${name}" thành công.`);
                setShowForm(false);
                fetchSpecialties();
            } catch (err) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chuyên khoa.');
            }
        } else {
            // Add
            try {
                await adminService.addSpecialty({ name, description });
                setSuccess(`Đã tạo chuyên khoa "${name}" thành công.`);
                setShowForm(false);
                fetchSpecialties();
            } catch (err) {
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chuyên khoa.');
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Quản Lý Chuyên Khoa</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Quản trị danh mục chuyên khoa khám chữa bệnh tại hệ thống y tế.</p>
                </div>
                {!showForm && (
                    <button onClick={handleOpenAdd} className="btn btn-primary">
                        <Plus size={18} />
                        <span>Thêm Chuyên Khoa Mới</span>
                    </button>
                )}
            </div>

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

            {showForm ? (
                <div className="glass fade-in" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', maxWidth: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem' }}>
                            {editingSpecialty ? `Chỉnh sửa chuyên khoa: ${editingSpecialty.Name}` : 'Thêm chuyên khoa mới'}
                        </h2>
                        <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="specName">Tên chuyên khoa *</label>
                            <input
                                type="text"
                                id="specName"
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ví dụ: Tai Mũi Họng, Nhi Khoa..."
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" htmlFor="specDesc">Mô tả chuyên môn</label>
                            <textarea
                                id="specDesc"
                                className="form-input"
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ghi tóm tắt phạm vi khám điều trị của chuyên khoa..."
                                style={{ resize: 'none' }}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                                <Save size={16} />
                                <span>Lưu Lại</span>
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                                Hủy bỏ
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clipboard size={20} color="var(--primary)" />
                        Danh sách chuyên khoa ({specialties.length})
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            Đang tải danh sách chuyên khoa...
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '250px' }}>Tên chuyên khoa</th>
                                        <th>Mô tả chuyên môn</th>
                                        <th style={{ textAlign: 'center', width: '120px' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {specialties.map(spec => (
                                        <tr key={spec.Id}>
                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{spec.Name}</td>
                                            <td>{spec.Description || 'Không có mô tả'}</td>
                                            <td>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleOpenEdit(spec)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                        title="Sửa"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(spec.Id, spec.Name)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                                        title="Xóa"
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
            )}
        </div>
    );
};

export default SpecialtyManagement;
