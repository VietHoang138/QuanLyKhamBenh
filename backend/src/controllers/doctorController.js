const { sql, poolPromise } = require('../config/db');

exports.getDoctorAppointments = async (req, res) => {
    const doctorId = req.user.id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
                SELECT a.Id, a.AppointmentDate, a.AppointmentTime, a.Status, a.Reason, a.CreatedAt,
                       p.Id AS PatientId, p.FullName AS PatientName, p.Email AS PatientEmail, 
                       p.Phone AS PatientPhone, p.Gender AS PatientGender, p.DateOfBirth AS PatientDOB
                FROM Appointments a
                INNER JOIN Users p ON a.PatientId = p.Id
                WHERE a.DoctorId = @doctorId
                ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting doctor appointments:', err);
        res.status(500).json({ message: 'Server error retrieving doctor appointments' });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    const doctorId = req.user.id;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
        return res.status(400).json({ message: 'Appointment ID and status are required' });
    }

    const validStatuses = ['approved', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('status', sql.VarChar, status)
            .input('appId', sql.Int, appointmentId)
            .input('doctorId', sql.Int, doctorId)
            .query(`
                UPDATE Appointments 
                SET Status = @status 
                WHERE Id = @appId AND DoctorId = @doctorId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Appointment not found or not assigned to this doctor' });
        }

        res.json({ message: `Appointment status updated to ${status}` });
    } catch (err) {
        console.error('Error updating appointment status:', err);
        res.status(500).json({ message: 'Server error updating status' });
    }
};

exports.getDoctorPatients = async (req, res) => {
    const doctorId = req.user.id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
                SELECT DISTINCT p.Id, p.FullName, p.Email, p.Phone, p.Gender, p.DateOfBirth, p.Address
                FROM Users p
                INNER JOIN Appointments a ON a.PatientId = p.Id
                WHERE a.DoctorId = @doctorId
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting doctor patients:', err);
        res.status(500).json({ message: 'Server error retrieving patients list' });
    }
};

exports.createMedicalRecord = async (req, res) => {
    const doctorId = req.user.id;
    const { appointmentId, patientId, symptoms, diagnosis, prescription, doctorNotes, aiSummary } = req.body;

    if (!appointmentId || !patientId || !diagnosis) {
        return res.status(400).json({ message: 'Appointment ID, Patient ID, and Diagnosis are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if record already exists
        const checkRecord = await pool.request()
            .input('appId', sql.Int, appointmentId)
            .query('SELECT Id FROM MedicalRecords WHERE AppointmentId = @appId');

        if (checkRecord.recordset.length > 0) {
            return res.status(400).json({ message: 'Medical record already exists for this appointment' });
        }

        // Insert medical record & Update appointment status to completed inside a transaction/sequential execution
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            await request
                .input('appId', sql.Int, appointmentId)
                .input('patientId', sql.Int, patientId)
                .input('doctorId', sql.Int, doctorId)
                .input('symptoms', sql.NVarChar, symptoms || null)
                .input('diagnosis', sql.NVarChar, diagnosis)
                .input('prescription', sql.NVarChar, prescription || null)
                .input('doctorNotes', sql.NVarChar, doctorNotes || null)
                .input('aiSummary', sql.NVarChar, aiSummary || null)
                .query(`
                    INSERT INTO MedicalRecords (AppointmentId, PatientId, DoctorId, Symptoms, Diagnosis, Prescription, DoctorNotes, AISummary)
                    VALUES (@appId, @patientId, @doctorId, @symptoms, @diagnosis, @prescription, @doctorNotes, @aiSummary)
                `);

            const updateRequest = new sql.Request(transaction);
            await updateRequest
                .input('appId', sql.Int, appointmentId)
                .input('doctorId', sql.Int, doctorId)
                .query(`
                    UPDATE Appointments 
                    SET Status = 'completed' 
                    WHERE Id = @appId AND DoctorId = @doctorId
                `);

            await transaction.commit();
            res.status(201).json({ message: 'Medical record created and appointment completed' });
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }

    } catch (err) {
        console.error('Error creating medical record:', err);
        res.status(500).json({ message: 'Server error creating medical record' });
    }
};

exports.getPatientMedicalHistory = async (req, res) => {
    // Both doctors and patients can access this, but we filter based on role/auth
    const { patientId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // A patient can only view their own history. A doctor can view any patient's history.
    if (currentUserRole === 'patient' && Number(patientId) !== currentUserId) {
        return res.status(403).json({ message: 'You are not authorized to view this medical history' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('patientId', sql.Int, patientId)
            .query(`
                SELECT mr.Id, mr.AppointmentId, mr.Symptoms, mr.Diagnosis, mr.Prescription, mr.DoctorNotes, mr.AISummary, mr.CreatedAt,
                       d.FullName AS DoctorName, s.Name AS SpecializationName
                FROM MedicalRecords mr
                INNER JOIN Users d ON mr.DoctorId = d.Id
                LEFT JOIN Specializations s ON d.SpecializationId = s.Id
                WHERE mr.PatientId = @patientId
                ORDER BY mr.CreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting patient medical history:', err);
        res.status(500).json({ message: 'Server error retrieving medical history' });
    }
};
