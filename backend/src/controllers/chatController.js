const { sql, poolPromise } = require('../config/db');

const ROLE_MAP = {
    'VT001': 'admin',
    'VT002': 'doctor',
    'VT003': 'patient',
};

// Gửi tin nhắn
exports.sendMessage = async (req, res) => {
    const senderId = req.user.id; // MaNguoiDung
    const { receiverId, messageText } = req.body;

    if (!receiverId || !messageText) {
        return res.status(400).json({ message: 'Người nhận và nội dung tin nhắn là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        // Kiểm tra người nhận tồn tại
        const checkReceiver = await pool.request()
            .input('recId', sql.VarChar, receiverId)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung = @recId');

        if (checkReceiver.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người nhận' });
        }

        // Tìm hoặc tạo cuộc trò chuyện
        // Xác định MaBenhNhan và MaBacSi
        const senderRoleResult = await pool.request()
            .input('id', sql.VarChar, senderId)
            .query('SELECT MaVaiTro FROM NguoiDung WHERE MaNguoiDung = @id');

        const senderRole = ROLE_MAP[senderRoleResult.recordset[0]?.MaVaiTro];

        let maBenhNhanId, maBacSiUserId;
        if (senderRole === 'patient') {
            maBenhNhanId = senderId;
            maBacSiUserId = receiverId;
        } else {
            maBenhNhanId = receiverId;
            maBacSiUserId = senderId;
        }

        // Lấy MaBenhNhan & MaBacSi thực tế
        const bnResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, maBenhNhanId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @maNguoiDung');

        const bsResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, maBacSiUserId)
            .query('SELECT MaBacSi FROM BacSi WHERE MaNguoiDung = @maNguoiDung');

        // Tạo MaTinNhan mới
        const maxTnResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaTinNhan, 3, LEN(MaTinNhan)) AS INT)) AS MaxId
            FROM TinNhan
        `);
        const nextTnId = (maxTnResult.recordset[0].MaxId || 0) + 1;
        const newMaTinNhan = 'TN' + String(nextTnId).padStart(3, '0');

        // Tìm cuộc trò chuyện hiện tại hoặc tạo mới
        let maCuocTroChuyen = null;

        if (bnResult.recordset.length > 0 && bsResult.recordset.length > 0) {
            const maBenhNhan = bnResult.recordset[0].MaBenhNhan;
            const maBacSi = bsResult.recordset[0].MaBacSi;

            const ctcResult = await pool.request()
                .input('maBenhNhan', sql.VarChar, maBenhNhan)
                .input('maBacSi', sql.VarChar, maBacSi)
                .query(`
                    SELECT TOP 1 MaCuocTroChuyen FROM CuocTroChuyen
                    WHERE MaBenhNhan = @maBenhNhan AND MaBacSi = @maBacSi
                    ORDER BY NgayTao DESC
                `);

            if (ctcResult.recordset.length > 0) {
                maCuocTroChuyen = ctcResult.recordset[0].MaCuocTroChuyen;
            } else {
                // Tạo cuộc trò chuyện mới
                const maxCtcResult = await pool.request().query(`
                    SELECT MAX(CAST(SUBSTRING(MaCuocTroChuyen, 4, LEN(MaCuocTroChuyen)) AS INT)) AS MaxId
                    FROM CuocTroChuyen
                `);
                const nextCtcId = (maxCtcResult.recordset[0].MaxId || 0) + 1;
                maCuocTroChuyen = 'CTC' + String(nextCtcId).padStart(3, '0');

                await pool.request()
                    .input('maCuocTroChuyen', sql.VarChar, maCuocTroChuyen)
                    .input('maBenhNhan', sql.VarChar, maBenhNhan)
                    .input('maBacSi', sql.VarChar, maBacSi)
                    .query(`
                        INSERT INTO CuocTroChuyen (MaCuocTroChuyen, MaBenhNhan, MaBacSi, TrangThai)
                        VALUES (@maCuocTroChuyen, @maBenhNhan, @maBacSi, N'Đang hoạt động')
                    `);
            }
        }

        if (!maCuocTroChuyen) {
            return res.status(400).json({ message: 'Không thể xác định cuộc trò chuyện' });
        }

        await pool.request()
            .input('maTinNhan', sql.VarChar, newMaTinNhan)
            .input('maCuocTroChuyen', sql.VarChar, maCuocTroChuyen)
            .input('maNguoiGui', sql.VarChar, senderId)
            .input('noiDung', sql.NVarChar, messageText)
            .query(`
                INSERT INTO TinNhan (MaTinNhan, MaCuocTroChuyen, MaNguoiGui, NoiDung, LoaiTinNhan)
                VALUES (@maTinNhan, @maCuocTroChuyen, @maNguoiGui, @noiDung, N'Văn bản')
            `);

        res.status(201).json({ message: 'Gửi tin nhắn thành công' });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
    }
};

// Lấy lịch sử chat giữa 2 người
exports.getChatHistory = async (req, res) => {
    const currentUserId = req.user.id;
    const { otherUserId } = req.params;

    if (!otherUserId) {
        return res.status(400).json({ message: 'Cần ID người dùng kia' });
    }

    try {
        const pool = await poolPromise;

        // Tìm cuộc trò chuyện chung
        const ctcResult = await pool.request()
            .input('u1', sql.VarChar, currentUserId)
            .input('u2', sql.VarChar, otherUserId)
            .query(`
                SELECT TOP 1 ctc.MaCuocTroChuyen
                FROM CuocTroChuyen ctc
                INNER JOIN BenhNhan bn ON ctc.MaBenhNhan = bn.MaBenhNhan
                INNER JOIN BacSi bs ON ctc.MaBacSi = bs.MaBacSi
                WHERE (bn.MaNguoiDung = @u1 AND bs.MaNguoiDung = @u2)
                   OR (bn.MaNguoiDung = @u2 AND bs.MaNguoiDung = @u1)
                ORDER BY ctc.NgayTao DESC
            `);

        if (ctcResult.recordset.length === 0) {
            return res.json([]);
        }

        const maCuocTroChuyen = ctcResult.recordset[0].MaCuocTroChuyen;

        const result = await pool.request()
            .input('maCTC', sql.VarChar, maCuocTroChuyen)
            .query(`
                SELECT
                    tn.MaTinNhan        AS Id,
                    tn.MaNguoiGui       AS SenderId,
                    tn.NoiDung          AS MessageText,
                    tn.ThoiGianGui      AS CreatedAt,
                    nd.HoTen            AS SenderName
                FROM TinNhan tn
                INNER JOIN NguoiDung nd ON tn.MaNguoiGui = nd.MaNguoiDung
                WHERE tn.MaCuocTroChuyen = @maCTC
                ORDER BY tn.ThoiGianGui ASC
            `);

        // Đánh dấu đã đọc
        await pool.request()
            .input('maCTC', sql.VarChar, maCuocTroChuyen)
            .input('currentUser', sql.VarChar, currentUserId)
            .query(`
                UPDATE TinNhan SET DaDoc = 1
                WHERE MaCuocTroChuyen = @maCTC AND MaNguoiGui != @currentUser
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting chat history:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch sử chat' });
    }
};

// Lấy danh sách liên hệ chat
exports.getChatContacts = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const pool = await poolPromise;
        let result;

        if (userRole === 'doctor') {
            // Bác sĩ: lấy danh sách bệnh nhân đã có cuộc trò chuyện
            result = await pool.request()
                .input('userId', sql.VarChar, userId)
                .query(`
                    SELECT DISTINCT
                        nd.MaNguoiDung  AS Id,
                        nd.HoTen        AS FullName,
                        nd.Email        AS Email,
                        nd.SoDienThoai  AS Phone,
                        nd.GioiTinh     AS Gender,
                        'patient'       AS Role
                    FROM NguoiDung nd
                    INNER JOIN BenhNhan bn ON bn.MaNguoiDung = nd.MaNguoiDung
                    INNER JOIN CuocTroChuyen ctc ON ctc.MaBenhNhan = bn.MaBenhNhan
                    INNER JOIN BacSi bs ON ctc.MaBacSi = bs.MaBacSi
                    WHERE bs.MaNguoiDung = @userId
                `);
        } else if (userRole === 'patient') {
            // Bệnh nhân: lấy danh sách bác sĩ đã có cuộc trò chuyện hoặc có lịch hẹn
            result = await pool.request()
                .input('userId', sql.VarChar, userId)
                .query(`
                    SELECT DISTINCT
                        nd.MaNguoiDung      AS Id,
                        nd.HoTen            AS FullName,
                        nd.Email            AS Email,
                        nd.SoDienThoai      AS Phone,
                        nd.GioiTinh         AS Gender,
                        'doctor'            AS Role,
                        ck.TenChuyenKhoa    AS SpecializationName
                    FROM NguoiDung nd
                    INNER JOIN BacSi bs ON bs.MaNguoiDung = nd.MaNguoiDung
                    INNER JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
                    WHERE bs.MaBacSi IN (
                        SELECT ctc.MaBacSi
                        FROM CuocTroChuyen ctc
                        INNER JOIN BenhNhan bn ON ctc.MaBenhNhan = bn.MaBenhNhan
                        WHERE bn.MaNguoiDung = @userId
                        UNION
                        SELECT lh.MaBacSi
                        FROM LichHen lh
                        INNER JOIN BenhNhan bn ON lh.MaBenhNhan = bn.MaBenhNhan
                        WHERE bn.MaNguoiDung = @userId
                    )
                `);
        } else {
            // Admin: lấy tất cả bác sĩ và bệnh nhân
            result = await pool.request().query(`
                SELECT
                    nd.MaNguoiDung  AS Id,
                    nd.HoTen        AS FullName,
                    nd.Email        AS Email,
                    nd.SoDienThoai  AS Phone,
                    nd.GioiTinh     AS Gender
                FROM NguoiDung nd
                WHERE nd.MaVaiTro != 'VT001' AND nd.TrangThai = 1
            `);
        }

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting chat contacts:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách liên hệ' });
    }
};
