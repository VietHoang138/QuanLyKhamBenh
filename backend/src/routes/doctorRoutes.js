const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.get('/appointments', authenticateToken, authorizeRoles('doctor'), doctorController.getDoctorAppointments);
router.put('/appointments/status', authenticateToken, authorizeRoles('doctor'), doctorController.updateAppointmentStatus);
router.get('/patients', authenticateToken, authorizeRoles('doctor'), doctorController.getDoctorPatients);
router.post('/records', authenticateToken, authorizeRoles('doctor'), doctorController.createMedicalRecord);
router.get('/records/history/:patientId', authenticateToken, authorizeRoles('doctor', 'patient'), doctorController.getPatientMedicalHistory);

module.exports = router;
