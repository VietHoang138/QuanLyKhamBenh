const { sql, poolPromise } = require('../config/db');

// 1. Admin lấy danh sách hóa đơn toàn viện
exports.getPayments = async (req, res) => {
    try {
        const { status, search } = req.query;
        const pool = await poolPromise;
        
        let query = `
            SELECT 
                hd.MaHoaDon         AS Id,
                hd.MaBenhAn         AS MedicalRecordId,
                hd.MaBenhNhan       AS PatientId,
                nd_bn.HoTen         AS PatientName,
                nd_bn.SoDienThoai   AS PatientPhone,
                nd_bs.HoTen         AS DoctorName,
                hd.TongTien         AS SubTotal,
                hd.MucHuongBHYT     AS InsuranceCoverage,
                hd.GiamGiaBHYT      AS InsuranceDiscount,
                hd.ThanhTien        AS AmountToPay,
                hd.TrangThai        AS Status,
                hd.PhuongThucThanhToan AS PaymentMethod,
                hd.NgayTao          AS CreatedAt,
                hd.NgayThanhToan    AS PaidAt
            FROM HoaDon hd
            INNER JOIN BenhNhan bn ON bn.MaBenhNhan = hd.MaBenhNhan
            INNER JOIN NguoiDung nd_bn ON nd_bn.MaNguoiDung = bn.MaNguoiDung
            INNER JOIN BacSi bs ON bs.MaBacSi = hd.MaBacSi
            INNER JOIN NguoiDung nd_bs ON nd_bs.MaNguoiDung = bs.MaNguoiDung
            WHERE 1=1
        `;

        const request = pool.request();

        if (status) {
            request.input('status', sql.NVarChar, status);
            query += ` AND hd.TrangThai = @status`;
        }

        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`);
            query += ` AND (nd_bn.HoTen LIKE @search OR hd.MaHoaDon LIKE @search OR hd.MaBenhNhan LIKE @search)`;
        }

        query += ` ORDER BY hd.NgayTao DESC`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách hóa đơn' });
    }
};

// 2. Bệnh nhân lấy danh sách hóa đơn cá nhân
exports.getMyPayments = async (req, res) => {
    const userId = req.user.id; // MaNguoiDung
    try {
        const pool = await poolPromise;
        
        // Lấy MaBenhNhan từ MaNguoiDung
        const bnResult = await pool.request()
            .input('userId', sql.VarChar, userId)
            .query('SELECT MaBenhNhan FROM BenhNhan WHERE MaNguoiDung = @userId');

        if (bnResult.recordset.length === 0) {
            return res.json([]);
        }
        const maBenhNhan = bnResult.recordset[0].MaBenhNhan;

        const result = await pool.request()
            .input('maBenhNhan', sql.VarChar, maBenhNhan)
            .query(`
                SELECT 
                    hd.MaHoaDon         AS Id,
                    hd.MaBenhAn         AS MedicalRecordId,
                    nd_bs.HoTen         AS DoctorName,
                    ck.TenChuyenKhoa    AS SpecializationName,
                    hd.TongTien         AS SubTotal,
                    hd.MucHuongBHYT     AS InsuranceCoverage,
                    hd.GiamGiaBHYT      AS InsuranceDiscount,
                    hd.ThanhTien        AS AmountToPay,
                    hd.TrangThai        AS Status,
                    hd.PhuongThucThanhToan AS PaymentMethod,
                    hd.NgayTao          AS CreatedAt,
                    hd.NgayThanhToan    AS PaidAt
                FROM HoaDon hd
                INNER JOIN BacSi bs ON bs.MaBacSi = hd.MaBacSi
                INNER JOIN NguoiDung nd_bs ON nd_bs.MaNguoiDung = bs.MaNguoiDung
                INNER JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
                WHERE hd.MaBenhNhan = @maBenhNhan
                ORDER BY hd.NgayTao DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching my payments:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách hóa đơn của bạn' });
    }
};

// 3. Chi tiết hóa đơn viện phí
exports.getPaymentDetail = async (req, res) => {
    const { id } = req.params; // MaHoaDon
    try {
        const pool = await poolPromise;

        // 1. Lấy thông tin chung của hoá đơn và bệnh án
        const hdResult = await pool.request()
            .input('id', sql.VarChar, id)
            .query(`
                SELECT 
                    hd.MaHoaDon         AS Id,
                    hd.MaBenhAn         AS MedicalRecordId,
                    hd.PhiKham          AS ExaminationFee,
                    hd.PhiThuoc         AS MedicineFee,
                    hd.PhiDichVu        AS ServiceFee,
                    hd.TongTien         AS SubTotal,
                    hd.MucHuongBHYT     AS InsuranceCoverage,
                    hd.GiamGiaBHYT      AS InsuranceDiscount,
                    hd.ThanhTien        AS AmountToPay,
                    hd.TrangThai        AS Status,
                    hd.PhuongThucThanhToan AS PaymentMethod,
                    hd.NgayTao          AS CreatedAt,
                    hd.NgayThanhToan    AS PaidAt,
                    
                    -- Patient details
                    nd_bn.HoTen         AS PatientName,
                    nd_bn.SoDienThoai   AS PatientPhone,
                    nd_bn.DiaChi        AS PatientAddress,
                    nd_bn.GioiTinh      AS PatientGender,
                    nd_bn.NgaySinh      AS PatientDateOfBirth,
                    bh.SoTheBHYT        AS PatientBHYTCode,
                    
                    -- Doctor details
                    nd_bs.HoTen         AS DoctorName,
                    ck.TenChuyenKhoa    AS SpecializationName
                FROM HoaDon hd
                INNER JOIN BenhNhan bn ON bn.MaBenhNhan = hd.MaBenhNhan
                INNER JOIN NguoiDung nd_bn ON nd_bn.MaNguoiDung = bn.MaNguoiDung
                LEFT JOIN BaoHiemYTe bh ON bh.MaBenhNhan = bn.MaBenhNhan
                INNER JOIN BacSi bs ON bs.MaBacSi = hd.MaBacSi
                INNER JOIN NguoiDung nd_bs ON nd_bs.MaNguoiDung = bs.MaNguoiDung
                INNER JOIN ChuyenKhoa ck ON ck.MaChuyenKhoa = bs.MaChuyenKhoa
                WHERE hd.MaHoaDon = @id
            `);

        if (hdResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn viện phí' });
        }

        const invoice = hdResult.recordset[0];

        // 2. Lấy đơn thuốc chi tiết của bệnh án đó
        const dtResult = await pool.request()
            .input('maBenhAn', sql.VarChar, invoice.MedicalRecordId)
            .query(`
                SELECT dt.MaDonThuoc
                FROM DonThuoc dt
                WHERE dt.MaBenhAn = @maBenhAn
            `);

        let drugs = [];
        if (dtResult.recordset.length > 0) {
            const maDonThuoc = dtResult.recordset[0].MaDonThuoc;
            const ctdtResult = await pool.request()
                .input('maDonThuoc', sql.VarChar, maDonThuoc)
                .query(`
                    SELECT 
                        TenThuoc    AS Name,
                        LieuDung    AS Dosage,
                        TanSuat     AS Frequency,
                        SoNgayDung  AS Days,
                        (SoNgayDung * 15000) AS Cost
                    FROM ChiTietDonThuoc
                    WHERE MaDonThuoc = @maDonThuoc
                `);
            drugs = ctdtResult.recordset;
        }

        res.json({
            ...invoice,
            Drugs: drugs
        });
    } catch (err) {
        console.error('Error fetching payment detail:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết hóa đơn' });
    }
};

// 4. Bệnh nhân thanh toán trực tuyến (Mock Chuyển khoản)
exports.payOnline = async (req, res) => {
    const { id } = req.params; // MaHoaDon
    const { paymentMethod } = req.body; // e.g. Chuyển khoản
    try {
        const pool = await poolPromise;

        // Cập nhật hóa đơn
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .input('method', sql.NVarChar, paymentMethod || 'Chuyển khoản')
            .query(`
                UPDATE HoaDon 
                SET TrangThai = N'Đã thanh toán', 
                    PhuongThucThanhToan = @method, 
                    NgayThanhToan = GETDATE()
                WHERE MaHoaDon = @id AND TrangThai = N'Chưa thanh toán'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: 'Hóa đơn đã thanh toán hoặc không tìm thấy' });
        }

        res.json({ message: 'Thanh toán hóa đơn trực tuyến thành công!' });
    } catch (err) {
        console.error('Error paying online:', err);
        res.status(500).json({ message: 'Lỗi server khi xử lý thanh toán' });
    }
};

// 5. Admin xác nhận thanh toán tiền mặt tại quầy
exports.confirmCashPayment = async (req, res) => {
    const { id } = req.params; // MaHoaDon
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query(`
                UPDATE HoaDon 
                SET TrangThai = N'Đã thanh toán', 
                    PhuongThucThanhToan = N'Tiền mặt', 
                    NgayThanhToan = GETDATE()
                WHERE MaHoaDon = @id AND TrangThai = N'Chưa thanh toán'
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: 'Hóa đơn đã thanh toán hoặc không tìm thấy' });
        }

        res.json({ message: 'Đã xác nhận thu tiền mặt thành công!' });
    } catch (err) {
        console.error('Error confirming cash payment:', err);
        res.status(500).json({ message: 'Lỗi server khi xác nhận thanh toán' });
    }
};

// 6. Thống kê doanh thu phục vụ Dashboard Admin
exports.getRevenueStatistics = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Thống kê tổng hợp (KPIs)
        const summaryResult = await pool.request().query(`
            SELECT 
                SUM(CASE WHEN TrangThai = N'Đã thanh toán' THEN ThanhTien ELSE 0 END) AS TotalRevenue,
                SUM(CASE WHEN TrangThai = N'Chưa thanh toán' THEN ThanhTien ELSE 0 END) AS TotalReceivable,
                SUM(GiamGiaBHYT) AS TotalBHYTDiscount,
                COUNT(MaHoaDon) AS TotalBillsCount,
                SUM(CASE WHEN TrangThai = N'Đã thanh toán' THEN 1 ELSE 0 END) AS PaidBillsCount
            FROM HoaDon
        `);

        // Thống kê doanh thu theo ngày (7 ngày gần nhất)
        const dailyResult = await pool.request().query(`
            SELECT 
                CONVERT(VARCHAR(10), COALESCE(NgayThanhToan, NgayTao), 103) AS DateLabel,
                SUM(CASE WHEN TrangThai = N'Đã thanh toán' THEN ThanhTien ELSE 0 END) AS DailyRevenue,
                SUM(CASE WHEN TrangThai = N'Chưa thanh toán' THEN ThanhTien ELSE 0 END) AS DailyReceivable
            FROM HoaDon
            WHERE NgayTao >= DATEADD(day, -7, GETDATE())
            GROUP BY CONVERT(VARCHAR(10), COALESCE(NgayThanhToan, NgayTao), 103)
            ORDER BY MIN(NgayTao) ASC
        `);

        // Thống kê theo phương thức thanh toán
        const methodResult = await pool.request().query(`
            SELECT 
                COALESCE(PhuongThucThanhToan, N'Chưa thanh toán') AS PaymentMethod,
                SUM(ThanhTien) AS TotalAmount,
                COUNT(MaHoaDon) AS Count
            FROM HoaDon
            GROUP BY PhuongThucThanhToan
        `);

        res.json({
            KPIs: summaryResult.recordset[0],
            DailyCharts: dailyResult.recordset,
            Methods: methodResult.recordset
        });
    } catch (err) {
        console.error('Error getting revenue stats:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê doanh thu' });
    }
};
