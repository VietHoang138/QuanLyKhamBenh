const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Map MaVaiTro → role string
const ROLE_MAP = {
    'VT001': 'admin',
    'VT002': 'doctor',
    'VT003': 'patient',
};

exports.register = async (req, res) => {
    const { email, password, fullName, phone, address, dateOfBirth, gender } = req.body;

    if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Email, mật khẩu và họ tên là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        // Check duplicate email
        const checkUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email này đã được đăng ký' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate new ID: get max existing ID and increment
        const maxIdResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaNguoiDung, 3, LEN(MaNguoiDung)) AS INT)) AS MaxId
            FROM NguoiDung
        `);
        const nextId = (maxIdResult.recordset[0].MaxId || 0) + 1;
        const newMaNguoiDung = 'ND' + String(nextId).padStart(3, '0');

        await pool.request()
            .input('maNguoiDung', sql.VarChar, newMaNguoiDung)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .query(`
                INSERT INTO NguoiDung
                    (MaNguoiDung, HoTen, Email, MatKhau, SoDienThoai, GioiTinh, NgaySinh, DiaChi, MaVaiTro)
                VALUES
                    (@maNguoiDung, @fullName, @email, @password, @phone, @gender, @dateOfBirth, @address, 'VT003')
            `);

        // Create patient record in BenhNhan table
        const maxBnResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaBenhNhan, 3, LEN(MaBenhNhan)) AS INT)) AS MaxId
            FROM BenhNhan
        `);
        const nextBnId = (maxBnResult.recordset[0].MaxId || 0) + 1;
        const newMaBenhNhan = 'BN' + String(nextBnId).padStart(3, '0');

        await pool.request()
            .input('maBenhNhan', sql.VarChar, newMaBenhNhan)
            .input('maNguoiDung', sql.VarChar, newMaNguoiDung)
            .query(`
                INSERT INTO BenhNhan (MaBenhNhan, MaNguoiDung)
                VALUES (@maBenhNhan, @maNguoiDung)
            `);

        res.status(201).json({ message: 'Đăng ký tài khoản bệnh nhân thành công' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng ký tài khoản' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query(`
                SELECT nd.MaNguoiDung, nd.HoTen, nd.Email, nd.MatKhau, nd.MaVaiTro,
                       nd.SoDienThoai, nd.GioiTinh, nd.NgaySinh, nd.DiaChi
                FROM NguoiDung nd
                WHERE nd.Email = @email AND nd.TrangThai = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.MatKhau);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const role = ROLE_MAP[user.MaVaiTro] || 'patient';

        const token = jwt.sign(
            {
                id: user.MaNguoiDung,
                email: user.Email,
                role: role,
                fullName: user.HoTen
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                Id: user.MaNguoiDung,
                Email: user.Email,
                FullName: user.HoTen,
                Role: role,
                Phone: user.SoDienThoai,
                Gender: user.GioiTinh,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
};

exports.getProfile = async (req, res) => {
    const userId = req.user.id; // MaNguoiDung (string)

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.VarChar, userId)
            .query(`
                SELECT
                    nd.MaNguoiDung  AS Id,
                    nd.Email        AS Email,
                    nd.HoTen        AS FullName,
                    nd.MaVaiTro,
                    nd.SoDienThoai  AS Phone,
                    nd.DiaChi       AS Address,
                    nd.NgaySinh     AS DateOfBirth,
                    nd.GioiTinh     AS Gender,
                    bs.MaChuyenKhoa AS SpecializationId,
                    ck.TenChuyenKhoa AS SpecializationName
                FROM NguoiDung nd
                LEFT JOIN BacSi bs ON bs.MaNguoiDung = nd.MaNguoiDung
                LEFT JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
                WHERE nd.MaNguoiDung = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const row = result.recordset[0];
        res.json({
            Id: row.Id,
            Email: row.Email,
            FullName: row.FullName,
            Role: ROLE_MAP[row.MaVaiTro] || 'patient',
            Phone: row.Phone,
            Address: row.Address,
            DateOfBirth: row.DateOfBirth,
            Gender: row.Gender,
            SpecializationId: row.SpecializationId,
            SpecializationName: row.SpecializationName,
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thông tin hồ sơ' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone, address, dateOfBirth, gender } = req.body;

    if (!fullName) {
        return res.status(400).json({ message: 'Họ tên là bắt buộc' });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.VarChar, userId)
            .input('fullName', sql.NVarChar, fullName)
            .input('phone', sql.VarChar, phone || null)
            .input('address', sql.NVarChar, address || null)
            .input('dateOfBirth', sql.Date, dateOfBirth || null)
            .input('gender', sql.NVarChar, gender || null)
            .query(`
                UPDATE NguoiDung
                SET HoTen       = @fullName,
                    SoDienThoai = @phone,
                    DiaChi      = @address,
                    NgaySinh    = @dateOfBirth,
                    GioiTinh    = @gender
                WHERE MaNguoiDung = @id
            `);

        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ' });
    }
};
