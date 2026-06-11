const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password, fullName, phone, address, dateOfBirth, gender } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Email, password, and full name are required' });
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

        // Insert patient
        await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .query(`
                INSERT INTO Users (Email, Password, FullName, Role, Phone, Address, DateOfBirth, Gender)
                VALUES (@email, @password, @fullName, 'patient', @phone, @address, @dateOfBirth, @gender)
            `);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.Id, email: user.Email, role: user.Role, fullName: user.FullName },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.Id,
                email: user.Email,
                role: user.Role,
                fullName: user.FullName
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

exports.getProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query(`
                SELECT u.Id, u.Email, u.FullName, u.Role, u.Phone, u.Address, u.DateOfBirth, u.Gender, u.SpecializationId, s.Name AS SpecializationName
                FROM Users u
                LEFT JOIN Specializations s ON u.SpecializationId = s.Id
                WHERE u.Id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone, address, dateOfBirth, gender } = req.body;

    if (!fullName) {
        return res.status(400).json({ message: 'Full name is required' });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .query(`
                UPDATE Users
                SET FullName = @fullName,
                    Phone = @phone,
                    Address = @address,
                    DateOfBirth = @dateOfBirth,
                    Gender = @gender
                WHERE Id = @id
            `);

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};
