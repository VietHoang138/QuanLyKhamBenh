import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Home, Calendar, User, Clipboard, MessageSquare, Bot, 
    Users, PlusCircle, BarChart2, Shield, HeartPulse, CreditCard 
} from 'lucide-react';

const Sidebar = () => {
    const { user } = useAuth();
    if (!user) return null;

    const navClass = ({ isActive }) => isActive ? 'active' : '';

    const renderPatientMenu = () => (
        <>
            <li className="sidebar-item">
                <NavLink to="/patient" end className={navClass}>
                    <Home size={18} />
                    <span>Trang chủ</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/appointments" className={navClass}>
                    <Calendar size={18} />
                    <span>Lịch khám của tôi</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/book" className={navClass}>
                    <PlusCircle size={18} />
                    <span>Đặt lịch khám</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/history" className={navClass}>
                    <Clipboard size={18} />
                    <span>Xem bệnh án</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/chat-doctor" className={navClass}>
                    <MessageSquare size={18} />
                    <span>Chat với bác sĩ</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/chat-ai" className={navClass}>
                    <Bot size={18} />
                    <span>Tư vấn AI</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/payments" className={navClass}>
                    <CreditCard size={18} />
                    <span>Thanh toán viện phí</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/patient/profile" className={navClass}>
                    <User size={18} />
                    <span>Hồ sơ cá nhân</span>
                </NavLink>
            </li>
        </>
    );

    const renderDoctorMenu = () => (
        <>
            <li className="sidebar-item">
                <NavLink to="/doctor" end className={navClass}>
                    <Calendar size={18} />
                    <span>Danh sách lịch khám</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/doctor/patients" className={navClass}>
                    <Users size={18} />
                    <span>Quản lý bệnh nhân</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/doctor/chat" className={navClass}>
                    <MessageSquare size={18} />
                    <span>Chat với bệnh nhân</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/doctor/payments" className={navClass}>
                    <CreditCard size={18} />
                    <span>Quản lý viện phí</span>
                </NavLink>
            </li>
        </>
    );

    const renderAdminMenu = () => (
        <>
            <li className="sidebar-item">
                <NavLink to="/admin" end className={navClass}>
                    <BarChart2 size={18} />
                    <span>Xem thống kê</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/admin/accounts" className={navClass}>
                    <Users size={18} />
                    <span>Quản lý tài khoản</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/admin/doctors" className={navClass}>
                    <Shield size={18} />
                    <span>Quản lý bác sĩ</span>
                </NavLink>
            </li>
            <li className="sidebar-item">
                <NavLink to="/admin/specialties" className={navClass}>
                    <HeartPulse size={18} />
                    <span>Quản lý chuyên khoa</span>
                </NavLink>
            </li>
        </>
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <HeartPulse size={28} />
                <span>MedCare Pro</span>
            </div>
            
            <ul className="sidebar-menu">
                {user.Role === 'patient' && renderPatientMenu()}
                {user.Role === 'doctor' && renderDoctorMenu()}
                {user.Role === 'admin' && renderAdminMenu()}
            </ul>
            
            <div className="sidebar-footer">
                <div className="user-info-card glass">
                    <div className="user-avatar">
                        {user.FullName ? user.FullName.charAt(0) : <User size={18} />}
                    </div>
                    <div className="user-details">
                        <span className="user-name">{user.FullName}</span>
                        <span className="user-role">
                            {user.Role === 'patient' ? 'Bệnh nhân' : user.Role === 'doctor' ? 'Bác sĩ' : 'Admin'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
