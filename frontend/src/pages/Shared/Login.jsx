import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, KeyRound, Mail, AlertTriangle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login(email, password);
        if (result.success) {
            // Role được trả về trực tiếp từ login response (lowercase: admin/doctor/patient)
            const role = result.role;
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'doctor') {
                navigate('/doctor');
            } else {
                navigate('/patient');
            }
        } else {
            setError(result.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass fade-in">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <HeartPulse size={48} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
                </div>
                <h2 className="auth-title">Hệ Thống MedCare</h2>
                <p className="auth-subtitle">Đăng nhập tài khoản khám bệnh của bạn</p>

                {error && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--danger-bg)',
                        color: '#EF4444',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Mail size={14} /> Email đăng nhập
                            </span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="username@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label" htmlFor="password">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <KeyRound size={14} /> Mật khẩu
                            </span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Chưa có tài khoản Bệnh nhân?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Đăng ký ngay
                    </Link>
                </p>
                
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <p>Tài khoản dùng thử (mật khẩu: <strong>123456</strong>)</p>
                    <p>🧑‍⚕️ Bệnh nhân: patient.an@gmail.com</p>
                    <p>👨‍⚕️ Bác sĩ: doctor.tmh@clinic.com</p>
                    <p>🔧 Quản trị: admin@clinic.com</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
