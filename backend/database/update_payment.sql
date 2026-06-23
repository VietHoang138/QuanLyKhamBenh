/*=========================================================
    BỔ SUNG BẢNG HOA DON & DỮ LIỆU MẪU BHYT, HOÁ ĐƠN
=========================================================*/

USE QuanLyKhamBenh;
GO

-- 1. Thêm dữ liệu mẫu vào bảng BaoHiemYTe (nếu chưa có)
INSERT INTO BaoHiemYTe (MaBHYT, MaBenhNhan, SoTheBHYT, NoiDangKyKCB, NgayBatDau, NgayHetHan, MucHuong, AnhThe)
VALUES 
('BH001', 'BN001', 'GD4797912345678', N'Bệnh viện Đa khoa Đà Nẵng', '2025-01-01', '2028-12-31', 80, NULL),
('BH002', 'BN003', 'GD4797922222222', N'Trung tâm Y tế Quận Hải Châu', '2025-06-01', '2027-06-01', 95, NULL),
('BH003', 'BN005', 'GD4797933333333', N'Bệnh viện Gia Đình Đà Nẵng', '2026-01-01', '2029-01-01', 100, NULL);
GO

-- 2. Tạo bảng HoaDon (Hóa đơn viện phí)
IF OBJECT_ID('HoaDon', 'U') IS NULL
BEGIN
    CREATE TABLE HoaDon
    (
        MaHoaDon VARCHAR(10) PRIMARY KEY,
        MaBenhAn VARCHAR(10) NOT NULL UNIQUE,
        MaBenhNhan VARCHAR(10) NOT NULL,
        MaBacSi VARCHAR(10) NOT NULL,
        PhiKham DECIMAL(18,2) NOT NULL DEFAULT 0,
        PhiThuoc DECIMAL(18,2) NOT NULL DEFAULT 0,
        PhiDichVu DECIMAL(18,2) NOT NULL DEFAULT 0,
        TongTien DECIMAL(18,2) NOT NULL DEFAULT 0,
        MucHuongBHYT INT DEFAULT 0,
        GiamGiaBHYT DECIMAL(18,2) NOT NULL DEFAULT 0,
        ThanhTien DECIMAL(18,2) NOT NULL DEFAULT 0,
        PhuongThucThanhToan NVARCHAR(50),
        TrangThai NVARCHAR(30) DEFAULT N'Chưa thanh toán',
        NgayTao DATETIME DEFAULT GETDATE(),
        NgayThanhToan DATETIME,

        CONSTRAINT FK_HoaDon_BenhAn FOREIGN KEY(MaBenhAn) REFERENCES BenhAn(MaBenhAn),
        CONSTRAINT FK_HoaDon_BenhNhan FOREIGN KEY(MaBenhNhan) REFERENCES BenhNhan(MaBenhNhan),
        CONSTRAINT FK_HoaDon_BacSi FOREIGN KEY(MaBacSi) REFERENCES BacSi(MaBacSi)
    );
END
GO

-- 3. Chèn dữ liệu mẫu cho bảng HoaDon
-- Hoá đơn HD001 cho bệnh án BA001 (BN001 có BHYT 80%, khám BS001 phí 300k, thuốc Amlodipine 30 ngày => 450k)
INSERT INTO HoaDon (MaHoaDon, MaBenhAn, MaBenhNhan, MaBacSi, PhiKham, PhiThuoc, PhiDichVu, TongTien, MucHuongBHYT, GiamGiaBHYT, ThanhTien, PhuongThucThanhToan, TrangThai, NgayTao, NgayThanhToan)
VALUES ('HD001', 'BA001', 'BN001', 'BS001', 300000, 450000, 0, 750000, 80, 600000, 150000, NULL, N'Chưa thanh toán', DATEADD(day, -3, GETDATE()), NULL);

-- Hoá đơn HD002 cho bệnh án BA002 (BN002 không BHYT, khám BS002 phí 350k, thuốc Amoxicillin 7 ngày => 105k, dịch vụ 50k)
INSERT INTO HoaDon (MaHoaDon, MaBenhAn, MaBenhNhan, MaBacSi, PhiKham, PhiThuoc, PhiDichVu, TongTien, MucHuongBHYT, GiamGiaBHYT, ThanhTien, PhuongThucThanhToan, TrangThai, NgayTao, NgayThanhToan)
VALUES ('HD002', 'BA002', 'BN002', 'BS002', 350000, 105000, 50000, 505000, 0, 0, 505000, N'Tiền mặt', N'Đã thanh toán', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()));

-- Hoá đơn HD003 cho bệnh án BA003 (BN003 có BHYT 95%, khám BS003 phí 250k, thuốc Vitamin C 15 ngày => 225k)
INSERT INTO HoaDon (MaHoaDon, MaBenhAn, MaBenhNhan, MaBacSi, PhiKham, PhiThuoc, PhiDichVu, TongTien, MucHuongBHYT, GiamGiaBHYT, ThanhTien, PhuongThucThanhToan, TrangThai, NgayTao, NgayThanhToan)
VALUES ('HD003', 'BA003', 'BN003', 'BS003', 250000, 225000, 0, 475000, 95, 451250, 23750, NULL, N'Chưa thanh toán', DATEADD(day, -1, GETDATE()), NULL);

-- Hoá đơn HD004 cho bệnh án BA004 (BN004 không BHYT, khám BS004 phí 280k, thuốc Cetirizine 10 ngày => 150k, dịch vụ X-ray 100k)
INSERT INTO HoaDon (MaHoaDon, MaBenhAn, MaBenhNhan, MaBacSi, PhiKham, PhiThuoc, PhiDichVu, TongTien, MucHuongBHYT, GiamGiaBHYT, ThanhTien, PhuongThucThanhToan, TrangThai, NgayTao, NgayThanhToan)
VALUES ('HD004', 'BA004', 'BN004', 'BS004', 280000, 150000, 100000, 530000, 0, 0, 530000, N'Chuyển khoản', N'Đã thanh toán', DATEADD(hour, -12, GETDATE()), DATEADD(hour, -11, GETDATE()));

-- Hoá đơn HD005 cho bệnh án BA005 (BN005 có BHYT 100%, khám BS005 phí 400k, không có thuốc)
INSERT INTO HoaDon (MaHoaDon, MaBenhAn, MaBenhNhan, MaBacSi, PhiKham, PhiThuoc, PhiDichVu, TongTien, MucHuongBHYT, GiamGiaBHYT, ThanhTien, PhuongThucThanhToan, TrangThai, NgayTao, NgayThanhToan)
VALUES ('HD005', 'BA005', 'BN005', 'BS005', 400000, 0, 0, 400000, 100, 400000, 0, N'Chuyển khoản', N'Đã thanh toán', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE()));
GO
