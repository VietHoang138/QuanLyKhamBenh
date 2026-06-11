/*=========================================================
    TẠO DATABASE
=========================================================*/

USE master;
GO

IF DB_ID('HealthcareAI') IS NOT NULL
BEGIN
    ALTER DATABASE HealthcareAI
    SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

    DROP DATABASE HealthcareAI;
END
GO

CREATE DATABASE HealthcareAI;
GO

USE HealthcareAI;
GO


/*=========================================================
01. BẢNG VAI TRÒ
=========================================================*/

CREATE TABLE VaiTro
(
    MaVaiTro VARCHAR(10) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) NOT NULL,
    MoTa NVARCHAR(255)
);
GO

/*=========================================================
02. BẢNG NGƯỜI DÙNG
=========================================================*/

CREATE TABLE NguoiDung
(
    MaNguoiDung VARCHAR(10) PRIMARY KEY,

    HoTen NVARCHAR(100) NOT NULL,

    Email VARCHAR(100) UNIQUE NOT NULL,

    MatKhau VARCHAR(255) NOT NULL,

    SoDienThoai VARCHAR(20),

    GioiTinh NVARCHAR(10),

    NgaySinh DATE,

    DiaChi NVARCHAR(255),

    MaVaiTro VARCHAR(10) NOT NULL,

    TrangThai BIT DEFAULT 1,

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_NguoiDung_VaiTro
    FOREIGN KEY(MaVaiTro)
    REFERENCES VaiTro(MaVaiTro)
);
GO

/*=========================================================
03. BẢNG CHUYÊN KHOA
=========================================================*/

CREATE TABLE ChuyenKhoa
(
    MaChuyenKhoa VARCHAR(10) PRIMARY KEY,

    TenChuyenKhoa NVARCHAR(100) NOT NULL,

    MoTa NVARCHAR(MAX)
);
GO

/*=========================================================
04. BẢNG BÁC SĨ
=========================================================*/

CREATE TABLE BacSi
(
    MaBacSi VARCHAR(10) PRIMARY KEY,

    MaNguoiDung VARCHAR(10) UNIQUE NOT NULL,

    MaChuyenKhoa VARCHAR(10) NOT NULL,

    HocVi NVARCHAR(100),

    SoNamKinhNghiem INT,

    SoChungChi NVARCHAR(100),

    PhiKham DECIMAL(18,2),

    CONSTRAINT FK_BacSi_NguoiDung
    FOREIGN KEY(MaNguoiDung)
    REFERENCES NguoiDung(MaNguoiDung),

    CONSTRAINT FK_BacSi_ChuyenKhoa
    FOREIGN KEY(MaChuyenKhoa)
    REFERENCES ChuyenKhoa(MaChuyenKhoa)
);
GO

/*=========================================================
05. BẢNG BỆNH NHÂN
=========================================================*/

CREATE TABLE BenhNhan
(
    MaBenhNhan VARCHAR(10) PRIMARY KEY,

    MaNguoiDung VARCHAR(10) UNIQUE NOT NULL,

    NhomMau NVARCHAR(10),

    DiUng NVARCHAR(MAX),

    TienSuBenh NVARCHAR(MAX),

    NguoiLienHeKhanCap NVARCHAR(100),

    CONSTRAINT FK_BenhNhan_NguoiDung
    FOREIGN KEY(MaNguoiDung)
    REFERENCES NguoiDung(MaNguoiDung)
);
GO

/*=========================================================
06. BẢNG LỊCH HẸN
=========================================================*/

CREATE TABLE LichHen
(
    MaLichHen VARCHAR(10) PRIMARY KEY,

    MaBenhNhan VARCHAR(10) NOT NULL,

    MaBacSi VARCHAR(10) NOT NULL,

    NgayHen DATETIME NOT NULL,

    TrangThai NVARCHAR(30),

    LyDoKham NVARCHAR(MAX),

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_LichHen_BenhNhan
    FOREIGN KEY(MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan),

    CONSTRAINT FK_LichHen_BacSi
    FOREIGN KEY(MaBacSi)
    REFERENCES BacSi(MaBacSi)
);
GO

/*=========================================================
07. BẢNG BỆNH ÁN
=========================================================*/

CREATE TABLE BenhAn
(
    MaBenhAn VARCHAR(10) PRIMARY KEY,

    MaLichHen VARCHAR(10) NOT NULL,

    MaBenhNhan VARCHAR(10) NOT NULL,

    MaBacSi VARCHAR(10) NOT NULL,

    TrieuChung NVARCHAR(MAX),

    ChanDoan NVARCHAR(MAX),

    PhuongAnDieuTri NVARCHAR(MAX),

    GhiChu NVARCHAR(MAX),

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_BenhAn_LichHen
    FOREIGN KEY(MaLichHen)
    REFERENCES LichHen(MaLichHen),

    CONSTRAINT FK_BenhAn_BenhNhan
    FOREIGN KEY(MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan),

    CONSTRAINT FK_BenhAn_BacSi
    FOREIGN KEY(MaBacSi)
    REFERENCES BacSi(MaBacSi)
);
GO

/*=========================================================
08. BẢNG ĐƠN THUỐC
=========================================================*/

CREATE TABLE DonThuoc
(
    MaDonThuoc VARCHAR(10) PRIMARY KEY,

    MaBenhAn VARCHAR(10) NOT NULL,

    NgayKeDon DATETIME DEFAULT GETDATE(),

    GhiChu NVARCHAR(MAX),

    CONSTRAINT FK_DonThuoc_BenhAn
    FOREIGN KEY(MaBenhAn)
    REFERENCES BenhAn(MaBenhAn)
);
GO

/*=========================================================
09. BẢNG CHI TIẾT ĐƠN THUỐC
=========================================================*/

CREATE TABLE ChiTietDonThuoc
(
    MaChiTiet VARCHAR(10) PRIMARY KEY,

    MaDonThuoc VARCHAR(10) NOT NULL,

    TenThuoc NVARCHAR(150),

    LieuDung NVARCHAR(100),

    TanSuat NVARCHAR(100),

    SoNgayDung INT,

    CONSTRAINT FK_CTDT_DonThuoc
    FOREIGN KEY(MaDonThuoc)
    REFERENCES DonThuoc(MaDonThuoc)
);
GO

/*=========================================================
10. BẢNG PHÂN TÍCH AI
=========================================================*/

CREATE TABLE PhanTichAI
(
    MaPhanTich VARCHAR(10) PRIMARY KEY,

    MaBenhNhan VARCHAR(10) NOT NULL,

    TrieuChungNhap NVARCHAR(MAX),

    BenhDuDoan NVARCHAR(MAX),

    MucDoRuiRo NVARCHAR(50),

    KhoaDeXuat NVARCHAR(100),

    NhaCungCapAI NVARCHAR(50),

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_PhanTichAI_BenhNhan
    FOREIGN KEY(MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan)
);
GO

/*=========================================================
11. BẢNG CUỘC TRÒ CHUYỆN
=========================================================*/

CREATE TABLE CuocTroChuyen
(
    MaCuocTroChuyen VARCHAR(10) PRIMARY KEY,

    MaBenhNhan VARCHAR(10) NOT NULL,

    MaBacSi VARCHAR(10) NOT NULL,

    TrangThai NVARCHAR(20),

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_CTC_BenhNhan
    FOREIGN KEY(MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan),

    CONSTRAINT FK_CTC_BacSi
    FOREIGN KEY(MaBacSi)
    REFERENCES BacSi(MaBacSi)
);
GO

/*=========================================================
12. BẢNG TIN NHẮN
=========================================================*/

CREATE TABLE TinNhan
(
    MaTinNhan VARCHAR(10) PRIMARY KEY,

    MaCuocTroChuyen VARCHAR(10) NOT NULL,

    MaNguoiGui VARCHAR(10) NOT NULL,

    NoiDung NVARCHAR(MAX) NOT NULL,

    LoaiTinNhan NVARCHAR(20),

    DaDoc BIT DEFAULT 0,

    ThoiGianGui DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_TinNhan_CTC
    FOREIGN KEY(MaCuocTroChuyen)
    REFERENCES CuocTroChuyen(MaCuocTroChuyen),

    CONSTRAINT FK_TinNhan_NguoiDung
    FOREIGN KEY(MaNguoiGui)
    REFERENCES NguoiDung(MaNguoiDung)
);
GO

/*=========================================================
13. BẢNG LỊCH SỬ CHAT AI
=========================================================*/

CREATE TABLE LichSuChatAI
(
    MaLichSuChat VARCHAR(10) PRIMARY KEY,

    MaBenhNhan VARCHAR(10) NOT NULL,

    CauHoi NVARCHAR(MAX) NOT NULL,

    CauTraLoi NVARCHAR(MAX) NOT NULL,

    NhaCungCapAI NVARCHAR(50),

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_LichSuChatAI_BenhNhan
    FOREIGN KEY(MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan)
);
GO

/*=========================================================
14. BẢNG THÔNG BÁO
=========================================================*/

CREATE TABLE ThongBao
(
    MaThongBao VARCHAR(10) PRIMARY KEY,

    MaNguoiDung VARCHAR(10) NOT NULL,

    TieuDe NVARCHAR(200) NOT NULL,

    NoiDung NVARCHAR(MAX) NOT NULL,

    DaDoc BIT DEFAULT 0,

    NgayTao DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_ThongBao_NguoiDung
    FOREIGN KEY(MaNguoiDung)
    REFERENCES NguoiDung(MaNguoiDung)
);
GO

/*=========================================================
15. BẢNG NHẬT KÝ HỆ THỐNG
=========================================================*/

CREATE TABLE NhatKyHeThong
(
    MaNhatKy VARCHAR(10) PRIMARY KEY,

    MaNguoiDung VARCHAR(10) NOT NULL,

    HanhDong NVARCHAR(200) NOT NULL,

    TenBang NVARCHAR(100),

    MaBanGhi VARCHAR(20),

    MoTa NVARCHAR(MAX),

    ThoiGian DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_NhatKy_NguoiDung
    FOREIGN KEY(MaNguoiDung)
    REFERENCES NguoiDung(MaNguoiDung)
);
GO

/*=========================================================
16. BẢNG TỆP ĐÍNH KÈM
=========================================================*/

CREATE TABLE TepDinhKem
(
    MaTep VARCHAR(10) PRIMARY KEY,

    MaBenhAn VARCHAR(10) NOT NULL,

    TenTep NVARCHAR(255) NOT NULL,

    DuongDan NVARCHAR(500) NOT NULL,

    LoaiTep NVARCHAR(50),

    KichThuoc BIGINT,

    NgayTaiLen DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_TepDinhKem_BenhAn
    FOREIGN KEY(MaBenhAn)
    REFERENCES BenhAn(MaBenhAn)
);
GO

-- Bảo hiểm y tế
CREATE TABLE BaoHiemYTe
(
    MaBHYT VARCHAR(10) PRIMARY KEY,

    MaBenhNhan VARCHAR(10) NOT NULL,

    SoTheBHYT VARCHAR(20) UNIQUE,

    NoiDangKyKCB NVARCHAR(255),

    NgayBatDau DATE,

    NgayHetHan DATE,

    MucHuong INT,

    AnhThe NVARCHAR(500),

    FOREIGN KEY (MaBenhNhan)
    REFERENCES BenhNhan(MaBenhNhan)
);

/*=========================================================
01. DỮ LIỆU BẢNG VAI TRÒ
=========================================================*/

INSERT INTO VaiTro
VALUES
('VT001',N'Quản trị viên',N'Quản lý toàn bộ hệ thống'),
('VT002',N'Bác sĩ',N'Thực hiện khám và điều trị'),
('VT003',N'Bệnh nhân',N'Sử dụng dịch vụ khám bệnh'),
('VT004',N'Điều dưỡng',N'Hỗ trợ bác sĩ'),
('VT005',N'Nhân viên',N'Tiếp nhận và hỗ trợ khách hàng');
GO

/*=========================================================
02. DỮ LIỆU BẢNG NGƯỜI DÙNG
=========================================================*/

INSERT INTO NguoiDung
(
    MaNguoiDung,
    HoTen,
    Email,
    MatKhau,
    SoDienThoai,
    GioiTinh,
    NgaySinh,
    DiaChi,
    MaVaiTro
)
VALUES
(
'ND001',
N'Nguyễn Văn Admin',
'admin@gmail.com',
'123456',
'0901111111',
N'Nam',
'1990-01-01',
N'Đà Nẵng',
'VT001'
),
(
'ND002',
N'Trần Thị Bình',
'doctor1@gmail.com',
'123456',
'0902222222',
N'Nữ',
'1985-02-15',
N'Hà Nội',
'VT002'
),
(
'ND003',
N'Lê Văn Cường',
'doctor2@gmail.com',
'123456',
'0903333333',
N'Nam',
'1982-07-10',
N'TP Hồ Chí Minh',
'VT002'
),
(
'ND004',
N'Phạm Quốc Dũng',
'doctor3@gmail.com',
'123456',
'0904444444',
N'Nam',
'1987-03-05',
N'Huế',
'VT002'
),
(
'ND005',
N'Nguyễn Thị Lan',
'doctor4@gmail.com',
'123456',
'0905555555',
N'Nữ',
'1984-05-22',
N'Đà Nẵng',
'VT002'
),
(
'ND006',
N'Hoàng Minh Khang',
'doctor5@gmail.com',
'123456',
'0906666666',
N'Nam',
'1980-11-11',
N'Quảng Nam',
'VT002'
),
(
'ND007',
N'Võ Thị Mai',
'patient1@gmail.com',
'123456',
'0907777771',
N'Nữ',
'2000-01-01',
N'Đà Nẵng',
'VT003'
),
(
'ND008',
N'Trần Quốc Bảo',
'patient2@gmail.com',
'123456',
'0907777772',
N'Nam',
'1999-02-02',
N'Hội An',
'VT003'
),
(
'ND009',
N'Lý Thu Hà',
'patient3@gmail.com',
'123456',
'0907777773',
N'Nữ',
'1998-03-03',
N'Huế',
'VT003'
),
(
'ND010',
N'Nguyễn Hoàng Nam',
'patient4@gmail.com',
'123456',
'0907777774',
N'Nam',
'1997-04-04',
N'Quảng Trị',
'VT003'
),
(
'ND011',
N'Phan Thị Hương',
'patient5@gmail.com',
'123456',
'0907777775',
N'Nữ',
'1996-05-05',
N'Tam Kỳ',
'VT003'
);
GO

/*=========================================================
03. DỮ LIỆU BẢNG CHUYÊN KHOA
=========================================================*/

INSERT INTO ChuyenKhoa
VALUES
(
'CK001',
N'Tim mạch',
N'Khám và điều trị bệnh tim mạch'
),
(
'CK002',
N'Tai Mũi Họng',
N'Khám và điều trị bệnh tai mũi họng'
),
(
'CK003',
N'Nội tổng quát',
N'Khám bệnh nội khoa'
),
(
'CK004',
N'Da liễu',
N'Khám và điều trị bệnh da'
),
(
'CK005',
N'Thần kinh',
N'Khám và điều trị bệnh thần kinh'
);
GO

/*=========================================================
04. DỮ LIỆU BẢNG BÁC SĨ
=========================================================*/

INSERT INTO BacSi
(
    MaBacSi,
    MaNguoiDung,
    MaChuyenKhoa,
    HocVi,
    SoNamKinhNghiem,
    SoChungChi,
    PhiKham
)
VALUES
('BS001','ND002','CK001',N'Thạc sĩ Y khoa',12,N'CC001',300000),
('BS002','ND003','CK002',N'Tiến sĩ Y khoa',15,N'CC002',350000),
('BS003','ND004','CK003',N'Bác sĩ CKI',8,N'CC003',250000),
('BS004','ND005','CK004',N'Thạc sĩ Da liễu',10,N'CC004',280000),
('BS005','ND006','CK005',N'Tiến sĩ Thần kinh',18,N'CC005',400000);

/*=========================================================
05. DỮ LIỆU BẢNG BỆNH NHÂN
=========================================================*/

INSERT INTO BenhNhan
VALUES
(
'BN001',
'ND007',
N'A+',
N'Dị ứng Penicillin',
N'Viêm phổi năm 2022',
N'Nguyễn Văn Minh - 0908888881'
),
(
'BN002',
'ND008',
N'O+',
N'Không',
N'Viêm xoang mãn tính',
N'Trần Thị Hoa - 0908888882'
),
(
'BN003',
'ND009',
N'B+',
N'Dị ứng hải sản',
N'Viêm dạ dày',
N'Lý Văn Hùng - 0908888883'
),
(
'BN004',
'ND010',
N'AB+',
N'Không',
N'Cao huyết áp',
N'Trần Thị Hạnh - 0908888884'
),
(
'BN005',
'ND011',
N'O-',
N'Dị ứng thuốc giảm đau',
N'Rối loạn tiền đình',
N'Phạm Văn Long - 0908888885'
);
GO

/*=========================================================
06. DỮ LIỆU BẢNG LỊCH HẸN
=========================================================*/

INSERT INTO LichHen
(
    MaLichHen,
    MaBenhNhan,
    MaBacSi,
    NgayHen,
    TrangThai,
    LyDoKham
)
VALUES
(
'LH001',
'BN001',
'BS001',
'2026-06-20 08:00:00',
N'Đã xác nhận',
N'Đau ngực'
),
(
'LH002',
'BN002',
'BS002',
'2026-06-20 09:00:00',
N'Chờ xác nhận',
N'Đau họng'
),
(
'LH003',
'BN003',
'BS003',
'2026-06-21 10:00:00',
N'Hoàn thành',
N'Khám sức khỏe'
),
(
'LH004',
'BN004',
'BS004',
'2026-06-21 14:00:00',
N'Đã xác nhận',
N'Nổi mẩn đỏ'
),
(
'LH005',
'BN005',
'BS005',
'2026-06-22 15:00:00',
N'Chờ xác nhận',
N'Đau đầu kéo dài'
);
GO

/*=========================================================
07. DỮ LIỆU BẢNG BỆNH ÁN
=========================================================*/

INSERT INTO BenhAn
(
    MaBenhAn,
    MaLichHen,
    MaBenhNhan,
    MaBacSi,
    TrieuChung,
    ChanDoan,
    PhuongAnDieuTri,
    GhiChu
)
VALUES
(
'BA001',
'LH001',
'BN001',
'BS001',
N'Đau ngực nhẹ',
N'Tăng huyết áp',
N'Theo dõi huyết áp và dùng thuốc',
N'Tái khám sau 1 tháng'
),
(
'BA002',
'LH002',
'BN002',
'BS002',
N'Đau họng, ho',
N'Viêm họng',
N'Dùng kháng sinh',
N'Uống nhiều nước'
),
(
'BA003',
'LH003',
'BN003',
'BS003',
N'Mệt mỏi',
N'Sức khỏe bình thường',
N'Nghỉ ngơi',
N'Không có'
),
(
'BA004',
'LH004',
'BN004',
'BS004',
N'Ngứa da',
N'Dị ứng da',
N'Bôi thuốc',
N'Tránh hải sản'
),
(
'BA005',
'LH005',
'BN005',
'BS005',
N'Đau đầu chóng mặt',
N'Rối loạn tiền đình',
N'Uống thuốc và nghỉ ngơi',
N'Hạn chế căng thẳng'
);
GO

/*=========================================================
08. DỮ LIỆU BẢNG ĐƠN THUỐC
=========================================================*/

INSERT INTO DonThuoc
(
    MaDonThuoc,
    MaBenhAn,
    GhiChu
)
VALUES
(
'DT001',
'BA001',
N'Uống sau ăn'
),
(
'DT002',
'BA002',
N'Uống đủ liệu trình'
),
(
'DT003',
'BA003',
N'Bổ sung vitamin'
),
(
'DT004',
'BA004',
N'Tái khám nếu nặng hơn'
),
(
'DT005',
'BA005',
N'Tránh làm việc quá sức'
);
GO

/*=========================================================
09. DỮ LIỆU BẢNG CHI TIẾT ĐƠN THUỐC
=========================================================*/

INSERT INTO ChiTietDonThuoc
(
    MaChiTiet,
    MaDonThuoc,
    TenThuoc,
    LieuDung,
    TanSuat,
    SoNgayDung
)
VALUES
(
'CT001',
'DT001',
N'Amlodipine 5mg',
N'1 viên',
N'1 lần/ngày',
30
),
(
'CT002',
'DT002',
N'Amoxicillin 500mg',
N'1 viên',
N'3 lần/ngày',
7
),
(
'CT003',
'DT003',
N'Vitamin C',
N'1 viên',
N'1 lần/ngày',
15
),
(
'CT004',
'DT004',
N'Cetirizine 10mg',
N'1 viên',
N'1 lần/ngày',
10
),
(
'CT005',
'DT005',
N'Betaserc 16mg',
N'1 viên',
N'2 lần/ngày',
14
);
GO

/*=========================================================
10. DỮ LIỆU BẢNG PHÂN TÍCH AI
=========================================================*/

INSERT INTO PhanTichAI
(
    MaPhanTich,
    MaBenhNhan,
    TrieuChungNhap,
    BenhDuDoan,
    MucDoRuiRo,
    KhoaDeXuat,
    NhaCungCapAI
)
VALUES
(
'AI001',
'BN001',
N'Đau ngực, khó thở',
N'Tăng huyết áp; Bệnh tim mạch',
N'Cao',
N'Tim mạch',
N'OpenAI'
),
(
'AI002',
'BN002',
N'Đau họng, ho',
N'Viêm họng; Cảm cúm',
N'Trung bình',
N'Tai Mũi Họng',
N'Claude'
),
(
'AI003',
'BN003',
N'Mệt mỏi kéo dài',
N'Thiếu máu; Stress',
N'Thấp',
N'Nội tổng quát',
N'OpenAI'
),
(
'AI004',
'BN004',
N'Nổi mẩn đỏ',
N'Dị ứng da',
N'Trung bình',
N'Da liễu',
N'Claude'
),
(
'AI005',
'BN005',
N'Đau đầu chóng mặt',
N'Rối loạn tiền đình',
N'Trung bình',
N'Thần kinh',
N'OpenAI'
);
GO

/*=========================================================
11. DỮ LIỆU BẢNG CUỘC TRÒ CHUYỆN
=========================================================*/

INSERT INTO CuocTroChuyen
(
    MaCuocTroChuyen,
    MaBenhNhan,
    MaBacSi,
    TrangThai
)
VALUES
(
'CTC001',
'BN001',
'BS001',
N'Đang hoạt động'
),
(
'CTC002',
'BN002',
'BS002',
N'Đang hoạt động'
),
(
'CTC003',
'BN003',
'BS003',
N'Đã đóng'
),
(
'CTC004',
'BN004',
'BS004',
N'Đang hoạt động'
),
(
'CTC005',
'BN005',
'BS005',
N'Đang hoạt động'
);
GO

/*=========================================================
12. DỮ LIỆU BẢNG TIN NHẮN
=========================================================*/

INSERT INTO TinNhan
(
    MaTinNhan,
    MaCuocTroChuyen,
    MaNguoiGui,
    NoiDung,
    LoaiTinNhan
)
VALUES
(
'TN001',
'CTC001',
'ND007',
N'Thưa bác sĩ, tôi bị đau ngực từ hôm qua.',
N'Văn bản'
),
(
'TN002',
'CTC002',
'ND008',
N'Tôi bị đau họng và sốt nhẹ.',
N'Văn bản'
),
(
'TN003',
'CTC003',
'ND004',
N'Kết quả khám của bạn hoàn toàn bình thường.',
N'Văn bản'
),
(
'TN004',
'CTC004',
'ND005',
N'Bạn vui lòng gửi ảnh vùng da bị dị ứng.',
N'Văn bản'
),
(
'TN005',
'CTC005',
'ND006',
N'Bạn nên nghỉ ngơi và theo dõi thêm.',
N'Văn bản'
);
GO

/*=========================================================
13. DỮ LIỆU BẢNG LỊCH SỬ CHAT AI
=========================================================*/

INSERT INTO LichSuChatAI
(
    MaLichSuChat,
    MaBenhNhan,
    CauHoi,
    CauTraLoi,
    NhaCungCapAI
)
VALUES
(
'LS001',
'BN001',
N'Tôi bị đau ngực và khó thở',
N'Bạn nên đến chuyên khoa Tim mạch để kiểm tra.',
N'OpenAI'
),
(
'LS002',
'BN002',
N'Tôi bị đau họng và ho nhiều',
N'Khả năng viêm họng hoặc cảm cúm.',
N'Claude'
),
(
'LS003',
'BN003',
N'Tôi thường xuyên mệt mỏi',
N'Có thể do thiếu máu hoặc căng thẳng.',
N'OpenAI'
),
(
'LS004',
'BN004',
N'Tôi bị nổi mẩn đỏ sau khi ăn hải sản',
N'Khả năng dị ứng thực phẩm.',
N'Claude'
),
(
'LS005',
'BN005',
N'Tôi bị chóng mặt khi đứng lên',
N'Có thể liên quan đến tiền đình hoặc huyết áp.',
N'OpenAI'
);
GO

/*=========================================================
14. DỮ LIỆU BẢNG THÔNG BÁO
=========================================================*/

INSERT INTO ThongBao
(
    MaThongBao,
    MaNguoiDung,
    TieuDe,
    NoiDung
)
VALUES
(
'TB001',
'ND007',
N'Xác nhận lịch khám',
N'Lịch khám LH001 đã được xác nhận.'
),
(
'TB002',
'ND008',
N'Nhắc lịch khám',
N'Bạn có lịch khám vào ngày mai.'
),
(
'TB003',
'ND002',
N'Có lịch hẹn mới',
N'Bạn vừa nhận được lịch khám mới.'
),
(
'TB004',
'ND003',
N'Cập nhật hồ sơ',
N'Bệnh nhân đã cập nhật hồ sơ sức khỏe.'
),
(
'TB005',
'ND001',
N'Báo cáo hệ thống',
N'Hệ thống đã tạo báo cáo thống kê tháng.'
);
GO

/*=========================================================
15. DỮ LIỆU BẢNG NHẬT KÝ HỆ THỐNG
=========================================================*/

INSERT INTO NhatKyHeThong
(
    MaNhatKy,
    MaNguoiDung,
    HanhDong,
    TenBang,
    MaBanGhi,
    MoTa
)
VALUES
(
'NK001',
'ND001',
N'Thêm người dùng',
N'NguoiDung',
'ND012',
N'Admin thêm tài khoản mới'
),
(
'NK002',
'ND002',
N'Cập nhật bệnh án',
N'BenhAn',
'BA001',
N'Bác sĩ cập nhật chẩn đoán'
),
(
'NK003',
'ND007',
N'Đặt lịch khám',
N'LichHen',
'LH001',
N'Bệnh nhân đặt lịch khám'
),
(
'NK004',
'ND008',
N'Sử dụng AI',
N'PhanTichAI',
'AI002',
N'Yêu cầu AI phân tích triệu chứng'
),
(
'NK005',
'ND001',
N'Xem báo cáo',
N'LichHen',
'LH005',
N'Admin xem báo cáo thống kê'
);
GO

/*=========================================================
16. DỮ LIỆU BẢNG TỆP ĐÍNH KÈM
=========================================================*/

INSERT INTO TepDinhKem
(
    MaTep,
    MaBenhAn,
    TenTep,
    DuongDan,
    LoaiTep,
    KichThuoc
)
VALUES
(
'TEP001',
'BA001',
N'ketqua_xetnghiem.pdf',
N'/uploads/ketqua_xetnghiem.pdf',
N'PDF',
204800
),
(
'TEP002',
'BA002',
N'anh_hong.jpg',
N'/uploads/anh_hong.jpg',
N'JPG',
102400
),
(
'TEP003',
'BA003',
N'khamtongquat.pdf',
N'/uploads/khamtongquat.pdf',
N'PDF',
150000
),
(
'TEP004',
'BA004',
N'dalieu.png',
N'/uploads/dalieu.png',
N'PNG',
180000
),
(
'TEP005',
'BA005',
N'thanhkinh.pdf',
N'/uploads/thanhkinh.pdf',
N'PDF',
220000
);
GO