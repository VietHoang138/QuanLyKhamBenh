const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/send', authenticateToken, chatController.sendMessage);
router.get('/history/:otherUserId', authenticateToken, chatController.getChatHistory);
router.get('/contacts', authenticateToken, chatController.getChatContacts);

module.exports = router;
