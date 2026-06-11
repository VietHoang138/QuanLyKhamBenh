const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');

// --- ACCOUNT MANAGEMENT ---
exports.getAccounts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT u.Id, u.Email, u.FullName, u.Role, u.Phone, u.Address, u.DateOfBirth, u.Gender, u.SpecializationId, s.Name as SpecializationName
            FROM Users u
            LEFT JOIN Specializations s ON u.SpecializationId = s.Id
            ORDER BY u.Role, u.FullName
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting accounts:', err);
        res.status(500).json({ message: 'Server error retrieving accounts' });
    }
};

exports.deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        
        // Prevent deleting yourself
        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }

        // Check if doctor has appointments before deletion (or handle cascading manually/safely)
        // For simplicity, we just delete or let database throw error if foreign key constraints fail.
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Users WHERE Id = @id');

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ message: 'Server error deleting account. Note: Cannot delete users with active clinical records/appointments.' });
    }
};

// --- DOCTOR MANAGEMENT ---
exports.addDoctor = async (req, res) => {
    const { email, password, fullName, phone, address, dateOfBirth, gender, specializationId } = req.body;

    if (!email || !password || !fullName || !specializationId) {
        return res.status(400).json({ message: 'Email, password, full name and specialization are required' });
    }

    try {
        const pool = await poolPromise;

        // Check if email already exists
        const checkUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT Id FROM Users WHERE Email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert doctor
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .input('specId', sql.Int, specializationId)
            .query(`
                INSERT INTO Users (Email, Password, FullName, Role, Phone, Address, DateOfBirth, Gender, SpecializationId)
                VALUES (@email, @password, @fullName, 'doctor', @phone, @address, @dateOfBirth, @gender, @specId)
            `);

        res.status(201).json({ message: 'Doctor account created successfully' });
    } catch (err) {
        console.error('Error adding doctor:', err);
        res.status(500).json({ message: 'Server error creating doctor account' });
    }
};

exports.updateDoctor = async (req, res) => {
    const { id } = req.params;
    const { fullName, phone, address, dateOfBirth, gender, specializationId } = req.body;

    if (!fullName || !specializationId) {
        return res.status(400).json({ message: 'Full name and specialization are required' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .input('specId', sql.Int, specializationId)
            .query(`
                UPDATE Users
                SET FullName = @fullName,
                    Phone = @phone,
                    Address = @address,
                    DateOfBirth = @dateOfBirth,
                    Gender = @gender,
                    SpecializationId = @specId
                WHERE Id = @id AND Role = 'doctor'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Doctor account not found' });
        }

        res.json({ message: 'Doctor profile updated successfully' });
    } catch (err) {
        console.error('Error updating doctor:', err);
        res.status(500).json({ message: 'Server error updating doctor account' });
    }
};

// --- SPECIALTY MANAGEMENT ---
exports.addSpecialty = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Specialty name is required' });
    }

    try {
        const pool = await poolPromise;

        // Check if specialty already exists
        const checkSpec = await pool.request()
            .input('name', sql.NVarChar, name)
            .query('SELECT Id FROM Specializations WHERE Name = @name');

        if (checkSpec.recordset.length > 0) {
            return res.status(400).json({ message: 'Specialty name already exists' });
        }

        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('desc', sql.NVarChar, description || null)
            .query('INSERT INTO Specializations (Name, Description) VALUES (@name, @desc)');

        res.status(201).json({ message: 'Specialty added successfully' });
    } catch (err) {
        console.error('Error adding specialty:', err);
        res.status(500).json({ message: 'Server error creating specialty' });
    }
};

exports.updateSpecialty = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Specialty name is required' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('desc', sql.NVarChar, description || null)
            .query('UPDATE Specializations SET Name = @name, Description = @desc WHERE Id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Specialty not found' });
        }

        res.json({ message: 'Specialty updated successfully' });
    } catch (err) {
        console.error('Error updating specialty:', err);
        res.status(500).json({ message: 'Server error updating specialty' });
    }
};

exports.deleteSpecialty = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        // Verify if any doctor is using this specialization
        const checkDoctor = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT Id FROM Users WHERE SpecializationId = @id');

        if (checkDoctor.recordset.length > 0) {
            return res.status(400).json({ message: 'Cannot delete specialty because doctors are currently assigned to it' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Specializations WHERE Id = @id');

        res.json({ message: 'Specialty deleted successfully' });
    } catch (err) {
        console.error('Error deleting specialty:', err);
        res.status(500).json({ message: 'Server error deleting specialty' });
    }
};

// --- STATISTICS ---
exports.getStatistics = async (req, res) => {
    try {
        const pool = await poolPromise;

        const patientsResult = await pool.request().query("SELECT COUNT(*) AS total FROM Users WHERE Role = 'patient'");
        const doctorsResult = await pool.request().query("SELECT COUNT(*) AS total FROM Users WHERE Role = 'doctor'");
        const appointmentsResult = await pool.request().query("SELECT COUNT(*) AS total FROM Appointments");
        
        const statusResult = await pool.request().query("SELECT Status, COUNT(*) AS count FROM Appointments GROUP BY Status");
        
        const specialtyDistributionResult = await pool.request().query(`
            SELECT s.Name AS SpecialtyName, COUNT(a.Id) AS AppointmentCount
            FROM Specializations s
            LEFT JOIN Users d ON d.SpecializationId = s.Id AND d.Role = 'doctor'
            LEFT JOIN Appointments a ON a.DoctorId = d.Id
            GROUP BY s.Name
        `);

        // Format statuses into object
        const appointmentStatusCount = {
            pending: 0,
            approved: 0,
            completed: 0,
            cancelled: 0
        };
        statusResult.recordset.forEach(row => {
            if (row.Status in appointmentStatusCount) {
                appointmentStatusCount[row.Status] = row.count;
            }
        });

        res.json({
            summary: {
                totalPatients: patientsResult.recordset[0].total,
                totalDoctors: doctorsResult.recordset[0].total,
                totalAppointments: appointmentsResult.recordset[0].total,
            },
            appointmentStatusCount,
            specialtyDistribution: specialtyDistributionResult.recordset
        });
    } catch (err) {
        console.error('Error getting statistics:', err);
        res.status(500).json({ message: 'Server error retrieving statistics' });
    }
};
