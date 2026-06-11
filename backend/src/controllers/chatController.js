const { sql, poolPromise } = require('../config/db');

exports.sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiverId, messageText } = req.body;

    if (!receiverId || !messageText) {
        return res.status(400).json({ message: 'Receiver ID and message text are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if receiver exists
        const checkReceiver = await pool.request()
            .input('recId', sql.Int, receiverId)
            .query('SELECT Id FROM Users WHERE Id = @recId');

        if (checkReceiver.recordset.length === 0) {
            return res.status(404).json({ message: 'Receiver not found' });
        }

        // Insert message
        await pool.request()
            .input('senderId', sql.Int, senderId)
            .input('receiverId', sql.Int, receiverId)
            .input('text', sql.NVarChar, messageText)
            .query(`
                INSERT INTO Messages (SenderId, ReceiverId, MessageText)
                VALUES (@senderId, @receiverId, @text)
            `);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

exports.getChatHistory = async (req, res) => {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
        return res.status(400).json({ message: 'Other user ID is required' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('currentUserId', sql.Int, currentUserId)
            .input('otherUserId', sql.Int, otherUserId)
            .query(`
                SELECT m.Id, m.SenderId, m.ReceiverId, m.MessageText, m.CreatedAt,
                       s.FullName AS SenderName, r.FullName AS ReceiverName
                FROM Messages m
                INNER JOIN Users s ON m.SenderId = s.Id
                INNER JOIN Users r ON m.ReceiverId = r.Id
                WHERE (m.SenderId = @currentUserId AND m.ReceiverId = @otherUserId)
                   OR (m.SenderId = @otherUserId AND m.ReceiverId = @currentUserId)
                ORDER BY m.CreatedAt ASC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting chat history:', err);
        res.status(500).json({ message: 'Server error retrieving chat history' });
    }
};

exports.getChatContacts = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const pool = await poolPromise;
        let result;

        if (userRole === 'doctor') {
            // Doctors: get patients who booked or chatted with them
            result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT DISTINCT u.Id, u.FullName, u.Email, u.Role, u.Phone, u.Gender
                    FROM Users u
                    WHERE u.Id IN (
                        SELECT PatientId FROM Appointments WHERE DoctorId = @userId
                        UNION
                        SELECT SenderId FROM Messages WHERE ReceiverId = @userId
                        UNION
                        SELECT ReceiverId FROM Messages WHERE SenderId = @userId
                    ) AND u.Id != @userId
                `);
        } else if (userRole === 'patient') {
            // Patients: get doctors who booked or chatted with them
            result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT DISTINCT u.Id, u.FullName, u.Email, u.Role, u.Phone, s.Name AS SpecializationName
                    FROM Users u
                    LEFT JOIN Specializations s ON u.SpecializationId = s.Id
                    WHERE u.Id IN (
                        SELECT DoctorId FROM Appointments WHERE PatientId = @userId
                        UNION
                        SELECT SenderId FROM Messages WHERE ReceiverId = @userId
                        UNION
                        SELECT ReceiverId FROM Messages WHERE SenderId = @userId
                    ) AND u.Id != @userId
                `);
        } else {
            // Admin can chat with anybody or just get all doctors + patients
            result = await pool.request().query(`
                SELECT Id, FullName, Email, Role, Phone
                FROM Users
                WHERE Role != 'admin'
            `);
        }

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting chat contacts:', err);
        res.status(500).json({ message: 'Server error retrieving chat contacts' });
    }
};
