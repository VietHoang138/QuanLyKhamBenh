const { sql, poolPromise } = require('../config/db');
const bcrypt = require('bcryptjs');

const ROLE_MAP = {
    'VT001': 'admin',
    'VT002': 'doctor',
    'VT003': 'patient',
};

// --- QUẢN LÝ TÀI KHOẢN ---

exports.getAccounts = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                nd.MaNguoiDung  AS Id,
                nd.Email        AS Email,
                nd.HoTen        AS FullName,
                nd.MaVaiTro,
                nd.SoDienThoai  AS Phone,
                nd.DiaChi       AS Address,
                nd.NgaySinh     AS DateOfBirth,
                nd.GioiTinh     AS Gender,
                ck.MaChuyenKhoa AS SpecializationId,
                ck.TenChuyenKhoa AS SpecializationName
            FROM NguoiDung nd
            LEFT JOIN BacSi bs ON bs.MaNguoiDung = nd.MaNguoiDung
            LEFT JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
            WHERE nd.TrangThai = 1
            ORDER BY nd.MaVaiTro, nd.HoTen
        `);

        const mapped = result.recordset.map(row => ({
            ...row,
            Role: ROLE_MAP[row.MaVaiTro] || 'patient',
            MaVaiTro: undefined
        }));

        res.json(mapped);
    } catch (err) {
        console.error('Error getting accounts:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài khoản' });
    }
};

exports.deleteAccount = async (req, res) => {
    const { id } = req.params; // MaNguoiDung
    try {
        const pool = await poolPromise;

        // Không cho xóa chính mình
        if (id === req.user.id) {
            return res.status(400).json({ message: 'Không thể xóa tài khoản admin đang đăng nhập' });
        }

        // Đánh dấu không hoạt động thay vì xóa hẳn (an toàn hơn do FK)
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query('UPDATE NguoiDung SET TrangThai = 0 WHERE MaNguoiDung = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        res.json({ message: 'Đã xóa tài khoản thành công' });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ message: 'Lỗi server khi xóa tài khoản. Lưu ý: không thể xóa tài khoản có dữ liệu bệnh án hoặc lịch khám.' });
    }
};

// --- QUẢN LÝ BÁC SĨ ---

exports.addDoctor = async (req, res) => {
    const { email, password, fullName, phone, address, dateOfBirth, gender, specializationId } = req.body;

    if (!email || !password || !fullName || !specializationId) {
        return res.status(400).json({ message: 'Email, mật khẩu, họ tên và chuyên khoa là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra email trùng
        const checkUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email này đã được đăng ký' });
        }

        // Kiểm tra chuyên khoa tồn tại
        const checkCK = await pool.request()
            .input('maCK', sql.VarChar, specializationId)
            .query('SELECT MaChuyenKhoa FROM ChuyenKhoa WHERE MaChuyenKhoa = @maCK');

        if (checkCK.recordset.length === 0) {
            return res.status(400).json({ message: 'Chuyên khoa không tồn tại' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo MaNguoiDung mới
        const maxNdResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaNguoiDung, 3, LEN(MaNguoiDung)) AS INT)) AS MaxId
            FROM NguoiDung
        `);
        const nextNdId = (maxNdResult.recordset[0].MaxId || 0) + 1;
        const newMaNguoiDung = 'ND' + String(nextNdId).padStart(3, '0');

        // Insert NguoiDung
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
                    (@maNguoiDung, @fullName, @email, @password, @phone, @gender, @dateOfBirth, @address, 'VT002')
            `);

        // Tạo MaBacSi mới
        const maxBsResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaBacSi, 3, LEN(MaBacSi)) AS INT)) AS MaxId
            FROM BacSi
        `);
        const nextBsId = (maxBsResult.recordset[0].MaxId || 0) + 1;
        const newMaBacSi = 'BS' + String(nextBsId).padStart(3, '0');

        // Insert BacSi
        await pool.request()
            .input('maBacSi', sql.VarChar, newMaBacSi)
            .input('maNguoiDung', sql.VarChar, newMaNguoiDung)
            .input('maChuyenKhoa', sql.VarChar, specializationId)
            .query(`
                INSERT INTO BacSi (MaBacSi, MaNguoiDung, MaChuyenKhoa)
                VALUES (@maBacSi, @maNguoiDung, @maChuyenKhoa)
            `);

        res.status(201).json({ message: 'Tạo tài khoản bác sĩ thành công' });
    } catch (err) {
        console.error('Error adding doctor:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo tài khoản bác sĩ' });
    }
};

exports.updateDoctor = async (req, res) => {
    const { id } = req.params; // MaNguoiDung
    const { fullName, phone, address, dateOfBirth, gender, specializationId } = req.body;

    if (!fullName || !specializationId) {
        return res.status(400).json({ message: 'Họ tên và chuyên khoa là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        // Cập nhật NguoiDung
        const result = await pool.request()
            .input('id', sql.VarChar, id)
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
                WHERE MaNguoiDung = @id AND MaVaiTro = 'VT002'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản bác sĩ' });
        }

        // Cập nhật chuyên khoa trong BacSi
        await pool.request()
            .input('id', sql.VarChar, id)
            .input('maChuyenKhoa', sql.VarChar, specializationId)
            .query(`
                UPDATE BacSi SET MaChuyenKhoa = @maChuyenKhoa
                WHERE MaNguoiDung = @id
            `);

        res.json({ message: 'Cập nhật thông tin bác sĩ thành công' });
    } catch (err) {
        console.error('Error updating doctor:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin bác sĩ' });
    }
};

// --- QUẢN LÝ CHUYÊN KHOA ---

exports.addSpecialty = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Tên chuyên khoa là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra tên trùng
        const checkSpec = await pool.request()
            .input('name', sql.NVarChar, name)
            .query('SELECT MaChuyenKhoa FROM ChuyenKhoa WHERE TenChuyenKhoa = @name');

        if (checkSpec.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên chuyên khoa đã tồn tại' });
        }

        // Tạo MaChuyenKhoa mới
        const maxCkResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaChuyenKhoa, 3, LEN(MaChuyenKhoa)) AS INT)) AS MaxId
            FROM ChuyenKhoa
        `);
        const nextCkId = (maxCkResult.recordset[0].MaxId || 0) + 1;
        const newMaChuyenKhoa = 'CK' + String(nextCkId).padStart(3, '0');

        await pool.request()
            .input('maChuyenKhoa', sql.VarChar, newMaChuyenKhoa)
            .input('name', sql.NVarChar, name)
            .input('desc', sql.NVarChar, description || null)
            .query(`
                INSERT INTO ChuyenKhoa (MaChuyenKhoa, TenChuyenKhoa, MoTa)
                VALUES (@maChuyenKhoa, @name, @desc)
            `);

        res.status(201).json({ message: 'Thêm chuyên khoa thành công' });
    } catch (err) {
        console.error('Error adding specialty:', err);
        res.status(500).json({ message: 'Lỗi server khi thêm chuyên khoa' });
    }
};

exports.updateSpecialty = async (req, res) => {
    const { id } = req.params; // MaChuyenKhoa
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Tên chuyên khoa là bắt buộc' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.NVarChar, name)
            .input('desc', sql.NVarChar, description || null)
            .query(`
                UPDATE ChuyenKhoa
                SET TenChuyenKhoa = @name, MoTa = @desc
                WHERE MaChuyenKhoa = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        res.json({ message: 'Cập nhật chuyên khoa thành công' });
    } catch (err) {
        console.error('Error updating specialty:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật chuyên khoa' });
    }
};

exports.deleteSpecialty = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;

        // Kiểm tra có bác sĩ đang dùng không
        const checkDoctor = await pool.request()
            .input('id', sql.VarChar, id)
            .query('SELECT MaBacSi FROM BacSi WHERE MaChuyenKhoa = @id');

        if (checkDoctor.recordset.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa chuyên khoa vì đang có bác sĩ được phân công' });
        }

        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query('DELETE FROM ChuyenKhoa WHERE MaChuyenKhoa = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy chuyên khoa' });
        }

        res.json({ message: 'Xóa chuyên khoa thành công' });
    } catch (err) {
        console.error('Error deleting specialty:', err);
        res.status(500).json({ message: 'Lỗi server khi xóa chuyên khoa' });
    }
};

// --- THỐNG KÊ ---

exports.getStatistics = async (req, res) => {
    try {
        const pool = await poolPromise;

        const patientsResult = await pool.request()
            .query("SELECT COUNT(*) AS total FROM NguoiDung WHERE MaVaiTro = 'VT003' AND TrangThai = 1");

        const doctorsResult = await pool.request()
            .query("SELECT COUNT(*) AS total FROM NguoiDung WHERE MaVaiTro = 'VT002' AND TrangThai = 1");

        const appointmentsResult = await pool.request()
            .query("SELECT COUNT(*) AS total FROM LichHen");

        const statusResult = await pool.request().query(`
            SELECT TrangThai, COUNT(*) AS count FROM LichHen GROUP BY TrangThai
        `);

        const specialtyDistributionResult = await pool.request().query(`
            SELECT
                ck.TenChuyenKhoa AS SpecialtyName,
                COUNT(lh.MaLichHen) AS AppointmentCount
            FROM ChuyenKhoa ck
            LEFT JOIN BacSi bs ON bs.MaChuyenKhoa = ck.MaChuyenKhoa
            LEFT JOIN LichHen lh ON lh.MaBacSi = bs.MaBacSi
            GROUP BY ck.TenChuyenKhoa
        `);

        // Map trạng thái tiếng Việt → tiếng Anh
        const appointmentStatusCount = { pending: 0, approved: 0, completed: 0, cancelled: 0 };
        const statusViToEn = {
            'Chờ xác nhận': 'pending',
            'Đã xác nhận':  'approved',
            'Hoàn thành':   'completed',
            'Đã hủy':       'cancelled',
        };
        statusResult.recordset.forEach(row => {
            const key = statusViToEn[row.TrangThai];
            if (key) appointmentStatusCount[key] = row.count;
        });

        res.json({
            summary: {
                totalPatients:     patientsResult.recordset[0].total,
                totalDoctors:      doctorsResult.recordset[0].total,
                totalAppointments: appointmentsResult.recordset[0].total,
            },
            appointmentStatusCount,
            specialtyDistribution: specialtyDistributionResult.recordset
        });
    } catch (err) {
        console.error('Error getting statistics:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
};
