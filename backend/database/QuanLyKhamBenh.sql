-- =============================================
-- TẠO DATABASE HEALTHCARE AI
-- =============================================

IF DB_ID('HealthcareAI') IS NOT NULL
BEGIN
    ALTER DATABASE HealthcareAI SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HealthcareAI;
END
GO

CREATE DATABASE HealthcareAI;
GO

USE HealthcareAI;
GO

-- =============================================
-- 01. BẢNG VAI TRÒ
-- Lưu thông tin phân quyền người dùng
-- =============================================

CREATE TABLE Roles
(
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255)
);
GO

-- =============================================
-- 02. BẢNG NGƯỜI DÙNG
-- Lưu tài khoản đăng nhập hệ thống
-- =============================================

CREATE TABLE Users
(
    UserID INT IDENTITY(1,1) PRIMARY KEY,

    FullName NVARCHAR(100) NOT NULL,

    Email VARCHAR(100) NOT NULL UNIQUE,

    PasswordHash NVARCHAR(255) NOT NULL,

    Phone VARCHAR(20),

    Gender NVARCHAR(20)
    CHECK (Gender IN ('Male','Female','Other')),

    DateOfBirth DATE,

    Address NVARCHAR(255),

    RoleID INT NOT NULL,

    IsActive BIT DEFAULT 1,

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Users_Roles
    FOREIGN KEY(RoleID)
    REFERENCES Roles(RoleID)
);
GO

-- =============================================
-- 03. BẢNG CHUYÊN KHOA
-- Danh sách các khoa khám bệnh
-- =============================================

CREATE TABLE Specializations
(
    SpecializationID INT IDENTITY(1,1) PRIMARY KEY,

    Name NVARCHAR(100) NOT NULL,

    Description NVARCHAR(MAX)
);
GO

-- =============================================
-- 04. BẢNG BÁC SĨ
-- Thông tin chuyên môn bác sĩ
-- =============================================

CREATE TABLE Doctors
(
    DoctorID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL UNIQUE,

    SpecializationID INT NOT NULL,

    Degree NVARCHAR(100),

    ExperienceYears INT DEFAULT 0,

    LicenseNumber NVARCHAR(100),

    ConsultationFee DECIMAL(10,2),

    CONSTRAINT FK_Doctors_User
    FOREIGN KEY(UserID)
    REFERENCES Users(UserID),

    CONSTRAINT FK_Doctors_Specialization
    FOREIGN KEY(SpecializationID)
    REFERENCES Specializations(SpecializationID)
);
GO

-- =============================================
-- 05. BẢNG BỆNH NHÂN
-- Hồ sơ bệnh nhân
-- =============================================

CREATE TABLE Patients
(
    PatientID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL UNIQUE,

    BloodType NVARCHAR(10),

    AllergyInfo NVARCHAR(MAX),

    MedicalHistory NVARCHAR(MAX),

    EmergencyContact NVARCHAR(100),

    CONSTRAINT FK_Patients_User
    FOREIGN KEY(UserID)
    REFERENCES Users(UserID)
);
GO

-- =============================================
-- 06. BẢNG LỊCH HẸN KHÁM
-- Quản lý lịch đặt khám
-- =============================================

CREATE TABLE Appointments
(
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,

    PatientID INT NOT NULL,

    DoctorID INT NOT NULL,

    AppointmentDate DATETIME NOT NULL,

    Status NVARCHAR(20)
    DEFAULT 'Pending'
    CHECK(Status IN ('Pending','Confirmed','Completed','Cancelled')),

    Reason NVARCHAR(MAX),

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Appointments_Patient
    FOREIGN KEY(PatientID)
    REFERENCES Patients(PatientID),

    CONSTRAINT FK_Appointments_Doctor
    FOREIGN KEY(DoctorID)
    REFERENCES Doctors(DoctorID)
);
GO

-- =============================================
-- 07. BẢNG BỆNH ÁN
-- Hồ sơ khám bệnh của bệnh nhân
-- =============================================

CREATE TABLE MedicalRecords
(
    RecordID INT IDENTITY(1,1) PRIMARY KEY,

    AppointmentID INT NOT NULL,

    PatientID INT NOT NULL,

    DoctorID INT NOT NULL,

    Symptoms NVARCHAR(MAX),

    Diagnosis NVARCHAR(MAX),

    TreatmentPlan NVARCHAR(MAX),

    Notes NVARCHAR(MAX),

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Record_Appointment
    FOREIGN KEY(AppointmentID)
    REFERENCES Appointments(AppointmentID),

    CONSTRAINT FK_Record_Patient
    FOREIGN KEY(PatientID)
    REFERENCES Patients(PatientID),

    CONSTRAINT FK_Record_Doctor
    FOREIGN KEY(DoctorID)
    REFERENCES Doctors(DoctorID)
);
GO

-- =============================================
-- 08. BẢNG ĐƠN THUỐC
-- Đơn thuốc sau khi khám
-- =============================================

CREATE TABLE Prescriptions
(
    PrescriptionID INT IDENTITY(1,1) PRIMARY KEY,

    RecordID INT NOT NULL,

    PrescriptionDate DATETIME DEFAULT GETDATE(),

    Notes NVARCHAR(MAX),

    CONSTRAINT FK_Prescription_Record
    FOREIGN KEY(RecordID)
    REFERENCES MedicalRecords(RecordID)
);
GO

-- =============================================
-- 09. BẢNG CHI TIẾT ĐƠN THUỐC
-- Danh sách thuốc trong đơn
-- =============================================

CREATE TABLE PrescriptionDetails
(
    DetailID INT IDENTITY(1,1) PRIMARY KEY,

    PrescriptionID INT NOT NULL,

    MedicineName NVARCHAR(150) NOT NULL,

    Dosage NVARCHAR(100),

    Frequency NVARCHAR(100),

    DurationDays INT,

    CONSTRAINT FK_PrescriptionDetail
    FOREIGN KEY(PrescriptionID)
    REFERENCES Prescriptions(PrescriptionID)
);
GO

-- =============================================
-- 10. BẢNG PHÂN TÍCH AI
-- Kết quả phân tích triệu chứng bằng AI
-- =============================================

CREATE TABLE AIAnalysis
(
    AnalysisID INT IDENTITY(1,1) PRIMARY KEY,

    PatientID INT NOT NULL,

    SymptomsInput NVARCHAR(MAX) NOT NULL,

    SuggestedDiseases NVARCHAR(MAX),

    RiskLevel NVARCHAR(20)
    CHECK(RiskLevel IN ('Low','Medium','High','Critical')),

    RecommendedDepartment NVARCHAR(100),

    AIProvider NVARCHAR(50),

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AIAnalysis_Patient
    FOREIGN KEY(PatientID)
    REFERENCES Patients(PatientID)
);
GO

-- =============================================
-- 11. BẢNG CUỘC TRÒ CHUYỆN
-- Quản lý phòng chat giữa bác sĩ và bệnh nhân
-- =============================================

CREATE TABLE Conversations
(
    ConversationID INT IDENTITY(1,1) PRIMARY KEY,

    PatientID INT NOT NULL,

    DoctorID INT NOT NULL,

    CreatedAt DATETIME DEFAULT GETDATE(),

    Status NVARCHAR(20)
    DEFAULT 'Active'
    CHECK(Status IN ('Active','Closed')),

    CONSTRAINT FK_Conversations_Patient
    FOREIGN KEY(PatientID)
    REFERENCES Patients(PatientID),

    CONSTRAINT FK_Conversations_Doctor
    FOREIGN KEY(DoctorID)
    REFERENCES Doctors(DoctorID)
);
GO

-- =============================================
-- 12. BẢNG TIN NHẮN
-- Lưu tin nhắn trong cuộc trò chuyện
-- =============================================

CREATE TABLE Messages
(
    MessageID INT IDENTITY(1,1) PRIMARY KEY,

    ConversationID INT NOT NULL,

    SenderUserID INT NOT NULL,

    MessageContent NVARCHAR(MAX) NOT NULL,

    MessageType NVARCHAR(20)
    DEFAULT 'Text'
    CHECK(MessageType IN ('Text','Image','File')),

    IsRead BIT DEFAULT 0,

    SentAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Messages_Conversation
    FOREIGN KEY(ConversationID)
    REFERENCES Conversations(ConversationID),

    CONSTRAINT FK_Messages_User
    FOREIGN KEY(SenderUserID)
    REFERENCES Users(UserID)
);
GO

-- =============================================
-- 13. BẢNG LỊCH SỬ CHAT AI
-- Lưu lịch sử trao đổi giữa người dùng và AI
-- =============================================

CREATE TABLE AIChatHistory
(
    ChatID INT IDENTITY(1,1) PRIMARY KEY,

    PatientID INT NOT NULL,

    UserQuestion NVARCHAR(MAX) NOT NULL,

    AIResponse NVARCHAR(MAX) NOT NULL,

    AIProvider NVARCHAR(50),

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AIChatHistory_Patient
    FOREIGN KEY(PatientID)
    REFERENCES Patients(PatientID)
);
GO

-- =============================================
-- 14. BẢNG THÔNG BÁO
-- Quản lý thông báo hệ thống
-- =============================================

CREATE TABLE Notifications
(
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL,

    Title NVARCHAR(200) NOT NULL,

    Content NVARCHAR(MAX) NOT NULL,

    IsRead BIT DEFAULT 0,

    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Notifications_User
    FOREIGN KEY(UserID)
    REFERENCES Users(UserID)
);
GO

-- =============================================
-- 15. BẢNG NHẬT KÝ HỆ THỐNG
-- Ghi nhận lịch sử thao tác của người dùng
-- =============================================

CREATE TABLE AuditLogs
(
    LogID INT IDENTITY(1,1) PRIMARY KEY,

    UserID INT NOT NULL,

    ActionName NVARCHAR(200) NOT NULL,

    TableName NVARCHAR(100),

    RecordID INT,

    Description NVARCHAR(MAX),

    LogTime DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AuditLogs_User
    FOREIGN KEY(UserID)
    REFERENCES Users(UserID)
);
GO

-- =============================================
-- 16. BẢNG TỆP ĐÍNH KÈM
-- Lưu file bệnh án, xét nghiệm, hình ảnh
-- =============================================

CREATE TABLE Attachments
(
    AttachmentID INT IDENTITY(1,1) PRIMARY KEY,

    RecordID INT NOT NULL,

    FileName NVARCHAR(255) NOT NULL,

    FilePath NVARCHAR(500) NOT NULL,

    FileType NVARCHAR(50),

    FileSize BIGINT,

    UploadedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Attachments_Record
    FOREIGN KEY(RecordID)
    REFERENCES MedicalRecords(RecordID)
);
GO