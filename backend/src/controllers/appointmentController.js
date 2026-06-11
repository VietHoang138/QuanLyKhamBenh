const { sql, poolPromise } = require('../config/db');

exports.getSpecializations = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Specializations');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting specializations:', err);
        res.status(500).json({ message: 'Server error retrieving specializations' });
    }
};

exports.getDoctors = async (req, res) => {
    const { specializationId } = req.query;
    try {
        const pool = await poolPromise;
        let query = `
            SELECT u.Id, u.FullName, u.Email, u.Phone, u.Gender, s.Id AS SpecializationId, s.Name AS SpecializationName
            FROM Users u
            INNER JOIN Specializations s ON u.SpecializationId = s.Id
            WHERE u.Role = 'doctor'
        `;
        const request = pool.request();
        
        if (specializationId) {
            query += ' AND u.SpecializationId = @specId';
            request.input('specId', sql.Int, specializationId);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting doctors:', err);
        res.status(500).json({ message: 'Server error retrieving doctors' });
    }
};

exports.bookAppointment = async (req, res) => {
    const patientId = req.user.id;
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ message: 'Doctor ID, appointment date, and time slot are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if the slot is already booked for this doctor
        const checkConflict = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('appDate', sql.Date, appointmentDate)
            .input('appTime', sql.VarChar, appointmentTime)
            .query(`
                SELECT Id FROM Appointments 
                WHERE DoctorId = @doctorId 
                  AND AppointmentDate = @appDate 
                  AND AppointmentTime = @appTime 
                  AND Status IN ('pending', 'approved')
            `);

        if (checkConflict.recordset.length > 0) {
            return res.status(400).json({ message: 'This slot is already booked. Please choose another time or doctor.' });
        }

        // Insert appointment
        await pool.request()
            .input('patientId', sql.Int, patientId)
            .input('doctorId', sql.Int, doctorId)
            .input('appDate', sql.Date, appointmentDate)
            .input('appTime', sql.VarChar, appointmentTime)
            .input('reason', sql.NVarChar, reason || null)
            .query(`
                INSERT INTO Appointments (PatientId, DoctorId, AppointmentDate, AppointmentTime, Status, Reason)
                VALUES (@patientId, @doctorId, @appDate, @appTime, 'pending', @reason)
            `);

        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (err) {
        console.error('Booking appointment error:', err);
        res.status(500).json({ message: 'Server error during booking' });
    }
};

exports.getPatientAppointments = async (req, res) => {
    const patientId = req.user.id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('patientId', sql.Int, patientId)
            .query(`
                SELECT a.Id, a.AppointmentDate, a.AppointmentTime, a.Status, a.Reason, a.CreatedAt,
                       d.FullName AS DoctorName, s.Name AS SpecializationName
                FROM Appointments a
                INNER JOIN Users d ON a.DoctorId = d.Id
                LEFT JOIN Specializations s ON d.SpecializationId = s.Id
                WHERE a.PatientId = @patientId
                ORDER BY a.AppointmentDate DESC, a.AppointmentTime DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Get patient appointments error:', err);
        res.status(500).json({ message: 'Server error retrieving appointments' });
    }
};
