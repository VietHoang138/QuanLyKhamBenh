const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.get('/specializations', authenticateToken, appointmentController.getSpecializations);
router.get('/doctors', authenticateToken, appointmentController.getDoctors);
router.post('/book', authenticateToken, authorizeRoles('patient'), appointmentController.bookAppointment);
router.get('/my-appointments', authenticateToken, authorizeRoles('patient'), appointmentController.getPatientAppointments);

module.exports = router;
