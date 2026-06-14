const { sql, poolPromise } = require('../config/db');

// Lấy danh sách chuyên khoa
exports.getSpecializations = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                MaChuyenKhoa AS Id,
                TenChuyenKhoa AS Name,
                MoTa AS Description
            FROM ChuyenKhoa
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting specializations:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách chuyên khoa' });
    }
};

// Lấy danh sách bác sĩ (có thể lọc theo chuyên khoa)
exports.getDoctors = async (req, res) => {
    const { specializationId } = req.query;
    try {
        const pool = await poolPromise;
        const request = pool.request();

        let query = `
            SELECT
                nd.MaNguoiDung      AS Id,
                nd.HoTen            AS FullName,
                nd.Email            AS Email,
                nd.SoDienThoai      AS Phone,
                nd.GioiTinh         AS Gender,
                ck.MaChuyenKhoa     AS SpecializationId,
                ck.TenChuyenKhoa    AS SpecializationName
            FROM NguoiDung nd
            INNER JOIN BacSi bs ON bs.MaNguoiDung = nd.MaNguoiDung
            INNER JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
            WHERE nd.TrangThai = 1
        `;

        if (specializationId) {
            query += ' AND ck.MaChuyenKhoa = @specId';
            request.input('specId', sql.VarChar, specializationId);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting doctors:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ' });
    }
};

// Đặt lịch hẹn
exports.bookAppointment = async (req, res) => {
    const patientUserId = req.user.id; // MaNguoiDung
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ message: 'Vui lòng chọn đầy đủ bác sĩ, ngày khám và khung giờ' });
    }

    try {
        const pool = await poolPromise;

        // Lấy MaBenhNhan từ MaNguoiDung
        const bnResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, patientUserId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @maNguoiDung');

        if (bnResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bệnh nhân' });
        }
        const maBenhNhan = bnResult.recordset[0].MaBenhNhan;

        // Lấy MaBacSi từ MaNguoiDung của bác sĩ
        const bsResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, doctorId)
            .query('SELECT MaBacSi FROM BacSi WHERE MaNguoiDung = @maNguoiDung');

        if (bsResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy bác sĩ được chọn' });
        }
        const maBacSi = bsResult.recordset[0].MaBacSi;

        // Kiểm tra trùng lịch
        const checkConflict = await pool.request()
            .input('maBacSi', sql.VarChar, maBacSi)
            .input('appDate', sql.Date, appointmentDate)
            .input('appTime', sql.VarChar, appointmentTime)
            .query(`
                SELECT MaLichHen FROM LichHen
                WHERE MaBacSi = @maBacSi
                  AND CAST(NgayHen AS DATE) = @appDate
                  AND CAST(NgayHen AS TIME(0)) = @appTime
                  AND TrangThai IN (N'Chờ xác nhận', N'Đã xác nhận')
            `);

        if (checkConflict.recordset.length > 0) {
            return res.status(400).json({ message: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.' });
        }

        // Tạo MaLichHen mới
        const maxLhResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaLichHen, 3, LEN(MaLichHen)) AS INT)) AS MaxId
            FROM LichHen
        `);
        const nextLhId = (maxLhResult.recordset[0].MaxId || 0) + 1;
        const newMaLichHen = 'LH' + String(nextLhId).padStart(3, '0');

        // Ghép ngày + giờ thành DATETIME
        const ngayHen = `${appointmentDate} ${appointmentTime}:00`;

        await pool.request()
            .input('maLichHen', sql.VarChar, newMaLichHen)
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .input('maBacSi', sql.VarChar, maBacSi)
            .input('ngayHen', sql.DateTime, new Date(ngayHen))
            .input('lyDo', sql.NVarChar, reason || null)
            .query(`
                INSERT INTO LichHen (MaLichHen, MaBenhNhan, MaBacSi, NgayHen, TrangThai, LyDoKham)
                VALUES (@maLichHen, @maBenhNhan, @maBacSi, @ngayHen, N'Chờ xác nhận', @lyDo)
            `);

        res.status(201).json({ message: 'Đặt lịch hẹn khám thành công' });
    } catch (err) {
        console.error('Booking appointment error:', err);
        res.status(500).json({ message: 'Lỗi server khi đặt lịch hẹn' });
    }
};

// Lấy lịch hẹn của bệnh nhân hiện tại
exports.getPatientAppointments = async (req, res) => {
    const patientUserId = req.user.id;

    try {
        const pool = await poolPromise;

        // Lấy MaBenhNhan
        const bnResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, patientUserId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @maNguoiDung');

        if (bnResult.recordset.length === 0) {
            return res.json([]);
        }
        const maBenhNhan = bnResult.recordset[0].MaBenhNhan;

        const result = await pool.request()
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .query(`
                SELECT
                    lh.MaLichHen                            AS Id,
                    CAST(lh.NgayHen AS DATE)                AS AppointmentDate,
                    CONVERT(VARCHAR(5), lh.NgayHen, 108)    AS AppointmentTime,
                    lh.TrangThai                            AS Status,
                    lh.LyDoKham                             AS Reason,
                    lh.NgayTao                              AS CreatedAt,
                    nd.HoTen                                AS DoctorName,
                    ck.TenChuyenKhoa                        AS SpecializationName
                FROM LichHen lh
                INNER JOIN BacSi bs ON lh.MaBacSi = bs.MaBacSi
                INNER JOIN NguoiDung nd ON bs.MaNguoiDung = nd.MaNguoiDung
                INNER JOIN ChuyenKhoa ck ON bs.MaChuyenKhoa = ck.MaChuyenKhoa
                WHERE lh.MaBenhNhan = @maBenhNhan
                ORDER BY lh.NgayHen DESC
            `);

        // Map trạng thái tiếng Việt → tiếng Anh cho frontend
        const statusMap = {
            'Chờ xác nhận': 'pending',
            'Đã xác nhận': 'approved',
            'Hoàn thành': 'completed',
            'Đã hủy': 'cancelled',
        };

        const mapped = result.recordset.map(row => ({
            ...row,
            Status: statusMap[row.Status] || row.Status
        }));

        res.json(mapped);
    } catch (err) {
        console.error('Get patient appointments error:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch hẹn' });
    }
};
