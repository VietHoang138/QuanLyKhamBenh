import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Activity } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={24} color="var(--primary)" />
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#FFF' }}>
                    MEDCARE
                </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                            {user.FullName ? user.FullName.charAt(0) : <User size={16} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.FullName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                {user.Role === 'patient' ? 'Bệnh nhân' : user.Role === 'doctor' ? 'Bác sĩ' : 'Quản trị viên'}
                            </span>
                        </div>
                    </div>
                )}
                
                <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
