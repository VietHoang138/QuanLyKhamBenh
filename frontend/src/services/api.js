import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';
const AI_URL = 'http://localhost:8000/api/ai';

// Create instance for NodeJS Backend API
export const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Create instance for Python AI Service API
export const aiApi = axios.create({
    baseURL: AI_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to attach JWT Token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper API methods
export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const appointmentService = {
    getSpecializations: () => api.get('/appointments/specializations'),
    getDoctors: (specializationId) => api.get(`/appointments/doctors${specializationId ? `?specializationId=${specializationId}` : ''}`),
    book: (bookingData) => api.post('/appointments/book', bookingData),
    getMyAppointments: () => api.get('/appointments/my-appointments'),
};

export const doctorService = {
    getAppointments: () => api.get('/doctor/appointments'),
    updateAppointmentStatus: (appointmentId, status) => api.put('/doctor/appointments/status', { appointmentId, status }),
    getPatients: () => api.get('/doctor/patients'),
    createMedicalRecord: (recordData) => api.post('/doctor/records', recordData),
    getPatientHistory: (patientId) => api.get(`/doctor/records/history/${patientId}`),
};

export const adminService = {
    getAccounts: () => api.get('/admin/accounts'),
    deleteAccount: (id) => api.delete(`/admin/accounts/${id}`),
    addDoctor: (doctorData) => api.post('/admin/doctors', doctorData),
    updateDoctor: (id, doctorData) => api.put(`/admin/doctors/${id}`, doctorData),
    addSpecialty: (specialtyData) => api.post('/admin/specialties', specialtyData),
    updateSpecialty: (id, specialtyData) => api.put(`/admin/specialties/${id}`, specialtyData),
    deleteSpecialty: (id) => api.delete(`/admin/specialties/${id}`),
    getStats: () => api.get('/admin/statistics'),
};

export const chatService = {
    getContacts: () => api.get('/chat/contacts'),
    getHistory: (otherUserId) => api.get(`/chat/history/${otherUserId}`),
    sendMessage: (receiverId, messageText) => api.post('/chat/send', { receiverId, messageText }),
};

export const aiService = {
    analyzeSymptoms: (symptoms) => aiApi.post('/analyze-symptoms', { symptoms }),
    suggestSpecialty: (symptoms) => aiApi.post('/suggest-specialty', { symptoms }),
    summarizeRecord: (recordData) => aiApi.post('/summarize-record', recordData),
};
