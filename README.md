# Hệ thống Quản Lý Khám Bệnh (Clinic Management System)

Dự án này là một ứng dụng web Quản lý Khám Bệnh đa tác nhân hỗ trợ Trợ lý AI phân tích triệu chứng và tóm tắt bệnh án. Hệ thống được tổ chức thành 3 phần:
1. **Frontend**: ReactJS (Vite, CSS thuần túy, Lucide Icons).
2. **Backend**: NodeJS & Express (kết nối cơ sở dữ liệu SQL Server, viết truy vấn SQL trực tiếp).
3. **AI Service**: Python & FastAPI (Cung cấp các API tư vấn triệu chứng, đề xuất chuyên khoa và tóm tắt bệnh án dưới dạng Mock cho giai đoạn kiểm thử luồng).

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (phiên bản 18+)
- [Python](https://www.python.org/) (phiên bản 3.9+)
- [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) (đã bật cổng TCP/IP kết nối ngoài)

---

## 📂 Hướng dẫn thiết lập chi tiết

### Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server
1. Mở **SQL Server Management Studio (SSMS)** hoặc công cụ quản trị SQL của bạn.
2. Tạo một cơ sở dữ liệu mới có tên: `QuanLyKhamBenh`.
3. Mở và chạy toàn bộ nội dung file script khởi tạo bảng và dữ liệu mẫu tại:
   [backend/database/init.sql](file:///d:/youtobe/QuanLyKhamBenh/backend/database/init.sql)
   *(Script sẽ tự động tạo các bảng `Specializations`, `Users`, `Appointments`, `MedicalRecords`, `Messages` và nạp sẵn tài khoản test)*.

### Bước 2: Cấu hình và Chạy Backend (NodeJS)
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình tệp `.env` (Đã được tạo sẵn mặc định. Hãy điều chỉnh mật khẩu `DB_PASSWORD` hoặc địa chỉ server `DB_SERVER` nếu SQL Server của bạn cấu hình khác):
   - Mở tệp [backend/.env](file:///d:/youtobe/QuanLyKhamBenh/backend/.env)
4. Chạy dịch vụ backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Dịch vụ sẽ lắng nghe tại cổng: `http://localhost:5000`*

### Bước 3: Cấu hình và Chạy AI Service (Python FastAPI)
1. Di chuyển vào thư mục `ai`:
   ```bash
   cd ai
   ```
2. Tạo môi trường ảo Python (khuyên dùng):
   ```bash
   python -m venv venv
   # Kích hoạt trên Windows:
   .\venv\Scripts\activate
   ```
3. Cài đặt các gói thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
4. Khởi chạy server FastAPI:
   ```bash
   python app/main.py
   ```
   *Dịch vụ AI sẽ chạy tại địa chỉ: `http://localhost:8000`*

### Bước 4: Cấu hình và Chạy Frontend (ReactJS)
1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các thư viện giao diện:
   ```bash
   npm install
   ```
3. Khởi động Web Server ở chế độ phát triển (Vite):
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ khả dụng tại địa chỉ: `http://localhost:5173`*

---

## 🔑 Tài khoản kiểm thử (Testing Accounts)
Tất cả các tài khoản dưới đây đều sử dụng mật khẩu mặc định: **`123456`**

| Vai trò (Role) | Email đăng nhập | Chức năng kiểm thử chính |
| :--- | :--- | :--- |
| **Quản trị (Admin)** | `admin@clinic.com` | Quản lý tài khoản, thêm bác sĩ, sửa chuyên khoa, xem thống kê biểu đồ. |
| **Bác sĩ (Doctor)** | `doctor.tmh@clinic.com` | Duyệt lịch khám, lập bệnh án, kê đơn thuốc và gọi AI tóm tắt hồ sơ. |
| **Bác sĩ (Doctor)** | `doctor.tim@clinic.com` | Duyệt lịch khám tim mạch. |
| **Bệnh nhân (Patient)** | `patient.an@gmail.com` | Tư vấn AI triệu chứng, đặt lịch khám, xem bệnh án cá nhân, chat bác sĩ. |
| **Bệnh nhân (Patient)** | `patient.binh@gmail.com` | Đặt lịch khám, chat với bác sĩ tim mạch. |
"# QuanLyKhamBenh" 
