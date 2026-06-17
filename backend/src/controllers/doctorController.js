const { sql, poolPromise } = require('../config/db');

// Map trạng thái tiếng Việt ↔ tiếng Anh
const STATUS_VI_TO_EN = {
    'Chờ xác nhận': 'pending',
    'Đã xác nhận':  'approved',
    'Hoàn thành':   'completed',
    'Đã hủy':       'cancelled',
};
const STATUS_EN_TO_VI = {
    'pending':   'Chờ xác nhận',
    'approved':  'Đã xác nhận',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
};

// Helper: lấy MaBacSi từ MaNguoiDung
async function getMaBacSi(pool, maNguoiDung) {
    const result = await pool.request()
        .input('maNguoiDung', sql.VarChar, maNguoiDung)
        .query('SELECT MaBacSi FROM BacSi WHERE MaNguoiDung = @maNguoiDung');
    return result.recordset.length > 0 ? result.recordset[0].MaBacSi : null;
}

// Lấy danh sách lịch hẹn của bác sĩ đang đăng nhập
exports.getDoctorAppointments = async (req, res) => {
    const doctorUserId = req.user.id;

    try {
        const pool = await poolPromise;
        const maBacSi = await getMaBacSi(pool, doctorUserId);
        if (!maBacSi) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bác sĩ' });
        }

        const result = await pool.request()
            .input('maBacSi', sql.VarChar, maBacSi)
            .query(`
                SELECT
                    lh.MaLichHen                            AS Id,
                    CAST(lh.NgayHen AS DATE)                AS AppointmentDate,
                    CONVERT(VARCHAR(5), lh.NgayHen, 108)    AS AppointmentTime,
                    lh.TrangThai                            AS StatusVi,
                    lh.LyDoKham                             AS Reason,
                    lh.NgayTao                              AS CreatedAt,
                    nd.MaNguoiDung                          AS PatientId,
                    nd.HoTen                                AS PatientName,
                    nd.Email                                AS PatientEmail,
                    nd.SoDienThoai                          AS PatientPhone,
                    nd.GioiTinh                             AS PatientGender,
                    nd.NgaySinh                             AS PatientDOB
                FROM LichHen lh
                INNER JOIN BenhNhan bn ON lh.MaBenhNhan = bn.MaBenhNhan
                INNER JOIN NguoiDung nd ON bn.MaNguoiDung = nd.MaNguoiDung
                WHERE lh.MaBacSi = @maBacSi
                ORDER BY lh.NgayHen DESC
            `);

        const mapped = result.recordset.map(row => ({
            ...row,
            Status: STATUS_VI_TO_EN[row.StatusVi] || row.StatusVi,
            StatusVi: undefined
        }));

        res.json(mapped);
    } catch (err) {
        console.error('Error getting doctor appointments:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách lịch hẹn' });
    }
};

// Cập nhật trạng thái lịch hẹn
exports.updateAppointmentStatus = async (req, res) => {
    const doctorUserId = req.user.id;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
        return res.status(400).json({ message: 'Mã lịch hẹn và trạng thái là bắt buộc' });
    }

    const validStatuses = ['approved', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    // Map tiếng Anh → tiếng Việt
    const statusViMap = {
        'approved':  'Đã xác nhận',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy',
    };

    try {
        const pool = await poolPromise;
        const maBacSi = await getMaBacSi(pool, doctorUserId);
        if (!maBacSi) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bác sĩ' });
        }

        const result = await pool.request()
            .input('trangThai', sql.NVarChar, statusViMap[status])
            .input('maLichHen', sql.VarChar, appointmentId)
            .input('maBacSi', sql.VarChar, maBacSi)
            .query(`
                UPDATE LichHen
                SET TrangThai = @trangThai
                WHERE MaLichHen = @maLichHen AND MaBacSi = @maBacSi
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc không có quyền thay đổi' });
        }

        res.json({ message: 'Cập nhật trạng thái lịch hẹn thành công' });
    } catch (err) {
        console.error('Error updating appointment status:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};

// Lấy danh sách bệnh nhân của bác sĩ
exports.getDoctorPatients = async (req, res) => {
    const doctorUserId = req.user.id;

    try {
        const pool = await poolPromise;
        const maBacSi = await getMaBacSi(pool, doctorUserId);
        if (!maBacSi) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bác sĩ' });
        }

        const result = await pool.request()
            .input('maBacSi', sql.VarChar, maBacSi)
            .query(`
                SELECT DISTINCT
                    nd.MaNguoiDung          AS Id,
                    nd.HoTen                AS FullName,
                    nd.Email                AS Email,
                    nd.SoDienThoai          AS Phone,
                    nd.GioiTinh             AS Gender,
                    nd.NgaySinh             AS DateOfBirth,
                    nd.DiaChi               AS Address,
                    bn.MaBenhNhan           AS MaBenhNhan,
                    bn.NhomMau              AS BloodType,
                    bn.DiUng                AS Allergies,
                    bn.TienSuBenh           AS MedicalHistory,
                    bn.NguoiLienHeKhanCap   AS EmergencyContact
                FROM NguoiDung nd
                INNER JOIN BenhNhan bn ON bn.MaNguoiDung = nd.MaNguoiDung
                INNER JOIN LichHen lh ON lh.MaBenhNhan = bn.MaBenhNhan
                WHERE lh.MaBacSi = @maBacSi
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error getting doctor patients:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách bệnh nhân' });
    }
};

// Tạo bệnh án
exports.createMedicalRecord = async (req, res) => {
    const doctorUserId = req.user.id;
    const { appointmentId, patientId, symptoms, diagnosis, prescription, drugs, doctorNotes, aiSummary } = req.body;

    if (!appointmentId || !patientId || !diagnosis) {
        return res.status(400).json({ message: 'Mã lịch hẹn, mã bệnh nhân và chẩn đoán là bắt buộc' });
    }

    try {
        const pool = await poolPromise;

        const maBacSi = await getMaBacSi(pool, doctorUserId);
        if (!maBacSi) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bác sĩ' });
        }

        // Lấy MaBenhNhan từ MaNguoiDung của bệnh nhân
        const bnResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, patientId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @maNguoiDung');

        if (bnResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy hồ sơ bệnh nhân' });
        }
        const maBenhNhan = bnResult.recordset[0].MaBenhNhan;

        // Kiểm tra bệnh án đã tồn tại chưa
        const checkRecord = await pool.request()
            .input('maLichHen', sql.VarChar, appointmentId)
            .query('SELECT MaBenhAn FROM BenhAn WHERE MaLichHen = @maLichHen');

        if (checkRecord.recordset.length > 0) {
            return res.status(400).json({ message: 'Bệnh án cho lịch hẹn này đã tồn tại' });
        }

        // Tạo MaBenhAn mới
        const maxBaResult = await pool.request().query(`
            SELECT MAX(CAST(SUBSTRING(MaBenhAn, 3, LEN(MaBenhAn)) AS INT)) AS MaxId
            FROM BenhAn
        `);
        const nextBaId = (maxBaResult.recordset[0].MaxId || 0) + 1;
        const newMaBenhAn = 'BA' + String(nextBaId).padStart(3, '0');

        // Insert bệnh án
        await pool.request()
            .input('maBenhAn', sql.VarChar, newMaBenhAn)
            .input('maLichHen', sql.VarChar, appointmentId)
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .input('maBacSi', sql.VarChar, maBacSi)
            .input('trieuChung', sql.NVarChar, symptoms || null)
            .input('chanDoan', sql.NVarChar, diagnosis)
            .input('phuongAn', sql.NVarChar, prescription || null)
            .input('ghiChu', sql.NVarChar,
                [doctorNotes, aiSummary ? `[AI] ${aiSummary}` : null].filter(Boolean).join('\n\n') || null
            )
            .query(`
                INSERT INTO BenhAn
                    (MaBenhAn, MaLichHen, MaBenhNhan, MaBacSi, TrieuChung, ChanDoan, PhuongAnDieuTri, GhiChu)
                VALUES
                    (@maBenhAn, @maLichHen, @maBenhNhan, @maBacSi, @trieuChung, @chanDoan, @phuongAn, @ghiChu)
            `);

        // Nếu có thuốc kê đơn chi tiết, lưu vào bảng DonThuoc và ChiTietDonThuoc
        if (drugs && Array.isArray(drugs) && drugs.length > 0) {
            // Tạo MaDonThuoc mới
            const maxDtResult = await pool.request().query(`
                SELECT MAX(CAST(SUBSTRING(MaDonThuoc, 3, LEN(MaDonThuoc)) AS INT)) AS MaxId
                FROM DonThuoc
            `);
            const nextDtId = (maxDtResult.recordset[0].MaxId || 0) + 1;
            const newMaDonThuoc = 'DT' + String(nextDtId).padStart(3, '0');

            // Lưu đơn thuốc
            await pool.request()
                .input('maDonThuoc', sql.VarChar, newMaDonThuoc)
                .input('maBenhAn', sql.VarChar, newMaBenhAn)
                .query(`
                    INSERT INTO DonThuoc (MaDonThuoc, MaBenhAn, NgayKeDon)
                    VALUES (@maDonThuoc, @maBenhAn, GETDATE())
                `);

            // Lưu chi tiết đơn thuốc
            const maxCtResult = await pool.request().query(`
                SELECT MAX(CAST(SUBSTRING(MaChiTiet, 3, LEN(MaChiTiet)) AS INT)) AS MaxId
                FROM ChiTietDonThuoc
            `);
            let nextCtId = (maxCtResult.recordset[0].MaxId || 0) + 1;

            for (const drug of drugs) {
                if (!drug.tenThuoc || !drug.tenThuoc.trim()) continue;

                const newMaChiTiet = 'CT' + String(nextCtId).padStart(3, '0');
                nextCtId++;

                await pool.request()
                    .input('maChiTiet', sql.VarChar, newMaChiTiet)
                    .input('maDonThuoc', sql.VarChar, newMaDonThuoc)
                    .input('tenThuoc', sql.NVarChar, drug.tenThuoc)
                    .input('lieuDung', sql.NVarChar, drug.lieuDung || null)
                    .input('tanSuat', sql.NVarChar, drug.tanSuat || null)
                    .input('soNgayDung', sql.Int, drug.soNgayDung ? parseInt(drug.soNgayDung) : null)
                    .query(`
                        INSERT INTO ChiTietDonThuoc (MaChiTiet, MaDonThuoc, TenThuoc, LieuDung, TanSuat, SoNgayDung)
                        VALUES (@maChiTiet, @maDonThuoc, @tenThuoc, @lieuDung, @tanSuat, @soNgayDung)
                    `);
            }
        }

        // Cập nhật trạng thái lịch hẹn → Hoàn thành
        await pool.request()
            .input('maLichHen', sql.VarChar, appointmentId)
            .query(`UPDATE LichHen SET TrangThai = N'Hoàn thành' WHERE MaLichHen = @maLichHen`);

        res.status(201).json({ message: 'Lưu bệnh án và hoàn thành ca khám thành công' });
    } catch (err) {
        console.error('Error creating medical record:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo bệnh án' });
    }
};

// Lấy lịch sử bệnh án của bệnh nhân
exports.getPatientMedicalHistory = async (req, res) => {
    const { patientId } = req.params; // patientId = MaNguoiDung
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    // Bệnh nhân chỉ xem được bệnh án của chính mình
    if (currentUserRole === 'patient' && patientId !== currentUserId) {
        return res.status(403).json({ message: 'Bạn không có quyền xem bệnh án của người khác' });
    }

    try {
        const pool = await poolPromise;

        // Lấy MaBenhNhan từ MaNguoiDung
        const bnResult = await pool.request()
            .input('maNguoiDung', sql.VarChar, patientId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @maNguoiDung');

        if (bnResult.recordset.length === 0) {
            return res.json([]);
        }
        const maBenhNhan = bnResult.recordset[0].MaBenhNhan;

        // Lấy danh sách bệnh án
        const result = await pool.request()
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .query(`
                SELECT
                    ba.MaBenhAn         AS Id,
                    ba.MaLichHen        AS AppointmentId,
                    ba.TrieuChung       AS Symptoms,
                    ba.ChanDoan         AS Diagnosis,
                    ba.PhuongAnDieuTri  AS Prescription,
                    ba.GhiChu           AS DoctorNotes,
                    ba.NgayTao          AS CreatedAt,
                    nd.HoTen            AS DoctorName,
                    ck.TenChuyenKhoa    AS SpecializationName
                FROM BenhAn ba
                INNER JOIN BacSi bs ON ba.MaBacSi = bs.MaBacSi
                INNER JOIN NguoiDung nd ON bs.MaNguoiDung = nd.MaNguoiDung
                INNER JOIN ChuyenKhoa ck ON bs.MaChuyenKhoa = ck.MaChuyenKhoa
                WHERE ba.MaBenhNhan = @maBenhNhan
                ORDER BY ba.NgayTao DESC
            `);

        // Lấy danh sách thuốc kê đơn chi tiết
        const drugsResult = await pool.request()
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .query(`
                SELECT
                    ct.MaChiTiet        AS Id,
                    dt.MaBenhAn         AS MedicalRecordId,
                    ct.TenThuoc         AS DrugName,
                    ct.LieuDung         AS Dosage,
                    ct.TanSuat          AS Frequency,
                    ct.SoNgayDung       AS Days
                FROM ChiTietDonThuoc ct
                INNER JOIN DonThuoc dt ON ct.MaDonThuoc = dt.MaDonThuoc
                INNER JOIN BenhAn ba ON dt.MaBenhAn = ba.MaBenhAn
                WHERE ba.MaBenhNhan = @maBenhNhan
            `);

        const drugsByRecord = {};
        drugsResult.recordset.forEach(drug => {
            if (!drugsByRecord[drug.MedicalRecordId]) {
                drugsByRecord[drug.MedicalRecordId] = [];
            }
            drugsByRecord[drug.MedicalRecordId].push({
                Id: drug.Id,
                DrugName: drug.DrugName,
                Dosage: drug.Dosage,
                Frequency: drug.Frequency,
                Days: drug.Days
            });
        });

        // Tách AISummary ra khỏi GhiChu nếu có tiền tố [AI]
        const mapped = result.recordset.map(row => {
            let doctorNotes = row.DoctorNotes || '';
            let aiSummary = '';
            const aiPrefix = '[AI] ';
            const aiIndex = doctorNotes.indexOf(aiPrefix);
            if (aiIndex !== -1) {
                aiSummary = doctorNotes.substring(aiIndex + aiPrefix.length).split('\n\n')[0];
                doctorNotes = doctorNotes.replace(`\n\n${aiPrefix}${aiSummary}`, '').replace(`${aiPrefix}${aiSummary}`, '').trim();
            }
            return {
                ...row,
                DoctorNotes: doctorNotes || null,
                AISummary: aiSummary || null,
                Drugs: drugsByRecord[row.Id] || []
            };
        });

        res.json(mapped);
    } catch (err) {
        console.error('Error getting patient medical history:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch sử bệnh án' });
    }
};

// Cập nhật thông tin y khoa bệnh nhân (dành cho bác sĩ)
exports.updatePatientClinicalInfo = async (req, res) => {
    const { patientId } = req.params; // MaNguoiDung
    const { bloodType, allergies, medicalHistory, emergencyContact } = req.body;

    try {
        const pool = await poolPromise;
        
        await pool.request()
            .input('patientId', sql.VarChar, patientId)
            .input('bloodType', sql.NVarChar, bloodType || null)
            .input('allergies', sql.NVarChar, allergies || null)
            .input('medicalHistory', sql.NVarChar, medicalHistory || null)
            .input('emergencyContact', sql.NVarChar, emergencyContact || null)
            .query(`
                UPDATE BenhNhan
                SET NhomMau = @bloodType,
                    DiUng = @allergies,
                    TienSuBenh = @medicalHistory,
                    NguoiLienHeKhanCap = @emergencyContact
                WHERE MaNguoiDung = @patientId
            `);

        res.json({ message: 'Cập nhật thông tin y khoa thành công' });
    } catch (err) {
        console.error('Error updating patient clinical info:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin y khoa bệnh nhân' });
    }
};
