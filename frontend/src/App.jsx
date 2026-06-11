import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Shared Pages & Components
import Login from './pages/Shared/Login';
import Register from './pages/Shared/Register';
import NotFound from './pages/Shared/NotFound';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Patient Pages
import PatientDashboard from './pages/Patient/Dashboard';
import BookAppointment from './pages/Patient/BookAppointment';
import MedicalHistory from './pages/Patient/MedicalHistory';
import ChatDoctor from './pages/Patient/ChatDoctor';
import ChatAI from './pages/Patient/ChatAI';
import Profile from './pages/Patient/Profile';

// Doctor Pages
import DoctorDashboard from './pages/Doctor/Dashboard';
import PatientList from './pages/Doctor/PatientList';
import CreateRecord from './pages/Doctor/CreateRecord';
import ChatPatient from './pages/Doctor/ChatPatient';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AccountManagement from './pages/Admin/AccountManagement';
import DoctorManagement from './pages/Admin/DoctorManagement';
import SpecialtyManagement from './pages/Admin/SpecialtyManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            {/* Common Layout Shell */}
            <Route element={<Layout />}>
              
              {/* Patient Routes */}
              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/patient/book" element={<BookAppointment />} />
                <Route path="/patient/history" element={<MedicalHistory />} />
                <Route path="/patient/chat-doctor" element={<ChatDoctor />} />
                <Route path="/patient/chat-ai" element={<ChatAI />} />
                <Route path="/patient/profile" element={<Profile />} />
              </Route>

              {/* Doctor Routes */}
              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/patients" element={<PatientList />} />
                <Route path="/doctor/create-record" element={<CreateRecord />} />
                <Route path="/doctor/chat" element={<ChatPatient />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/accounts" element={<AccountManagement />} />
                <Route path="/admin/doctors" element={<DoctorManagement />} />
                <Route path="/admin/specialties" element={<SpecialtyManagement />} />
              </Route>

            </Route>
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
