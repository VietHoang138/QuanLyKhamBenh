const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Apply admin role authorization to all routes below
router.use(authenticateToken, authorizeRoles('admin'));

// Account Management
router.get('/accounts', adminController.getAccounts);
router.delete('/accounts/:id', adminController.deleteAccount);

// Doctor Management
router.post('/doctors', adminController.addDoctor);
router.put('/doctors/:id', adminController.updateDoctor);

// Specialty Management
router.post('/specialties', adminController.addSpecialty);
router.put('/specialties/:id', adminController.updateSpecialty);
router.delete('/specialties/:id', adminController.deleteSpecialty);

// Statistics Dashboard
router.get('/statistics', adminController.getStatistics);

module.exports = router;
