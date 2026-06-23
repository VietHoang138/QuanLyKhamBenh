import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/api';
import { 
    CreditCard, Calendar, User, DollarSign, 
    FileText, CheckCircle, AlertCircle, X, 
    ArrowRight, QrCode, Download, ShieldCheck
} from 'lucide-react';

const PatientPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);
    const [paySuccess, setPaySuccess] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await paymentService.getMyPayments();
            setPayments(res.data);
        } catch (err) {
            console.error('Error fetching patient payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (id) => {
        setDetailLoading(true);
        try {
            const res = await paymentService.getPaymentDetail(id);
            setSelectedInvoice(res.data);
        } catch (err) {
            console.error('Error fetching payment detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handlePayOnline = async () => {
        if (!selectedInvoice) return;
        setPaying(true);
        try {
            await paymentService.payOnline(selectedInvoice.Id, 'Chuyển khoản');
            setPaySuccess(true);
            setTimeout(async () => {
                setShowPayModal(false);
                setPaySuccess(false);
                setSelectedInvoice(null);
                await fetchPayments();
            }, 2000);
        } catch (err) {
            console.error('Error processing mock payment:', err);
        } finally {
            setPaying(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <CreditCard size={28} style={{ color: 'var(--primary)' }} />
                <h1>Thanh Toán Viện Phí</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Xem danh sách hóa đơn khám bệnh lâm sàng, chi phí thuốc và thực hiện thanh toán trực tuyến nhanh chóng.
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner">Đang tải danh sách hóa đơn...</div>
                </div>
            ) : payments.length === 0 ? (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                    <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Không có hóa đơn nào</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa có hóa đơn khám bệnh nào cần thanh toán trong hệ thống.</p>
                </div>
            ) : (
                <div className="table-container glass fade-in">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Mã Hóa Đơn</th>
                                <th>Ngày Khám</th>
                                <th>Bác Sĩ</th>
                                <th>Chuyên Khoa</th>
                                <th>Tổng Tiền</th>
                                <th>BHYT Hỗ Trợ</th>
                                <th>Bệnh Nhân Trả</th>
                                <th>Trạng Thái</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.Id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.Id}</td>
                                    <td>{new Date(p.CreatedAt).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ fontWeight: '600' }}>{p.DoctorName}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{p.SpecializationName}</td>
                                    <td>{formatCurrency(p.SubTotal)}</td>
                                    <td style={{ color: p.InsuranceCoverage > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {p.InsuranceCoverage > 0 ? `-${p.InsuranceCoverage}% (${formatCurrency(p.InsuranceDiscount)})` : 'Không có'}
                                    </td>
                                    <td style={{ fontWeight: '700', color: '#FFF' }}>{formatCurrency(p.AmountToPay)}</td>
                                    <td>
                                        <span className={`badge ${p.Status === 'Đã thanh toán' ? 'badge-completed' : 'badge-pending'}`}>
                                            {p.Status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            onClick={() => handleViewDetail(p.Id)}
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Chi tiết Hóa đơn Modal */}
            {selectedInvoice && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '2rem'
                }}>
                    <div className="glass fade-in" style={{
                        width: '100%', maxWidth: '750px', borderRadius: 'var(--radius-lg)',
                        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)'
                        }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.35rem' }}>
                                <FileText size={22} style={{ color: 'var(--primary)' }} />
                                Phiếu Thu Viện Phí Chi Tiết
                            </h2>
                            <button 
                                onClick={() => setSelectedInvoice(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Invoice Body */}
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            {/* Clinic & Receipt Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', fontSize: '0.9rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', color: '#FFF', marginBottom: '0.25rem' }}>PHÒNG KHÁM ĐA KHOA MEDCARE</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>123 Đường Hải Phòng, Hải Châu, Đà Nẵng</p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Hotline: 1900-8888</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p>Số phiếu: <strong style={{ color: 'var(--primary)' }}>{selectedInvoice.Id}</strong></p>
                                    <p>Ngày lập: {formatDate(selectedInvoice.CreatedAt)}</p>
                                    <p>Trạng thái: <strong style={{ color: selectedInvoice.Status === 'Đã thanh toán' ? 'var(--success)' : 'var(--warning)' }}>{selectedInvoice.Status}</strong></p>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

                            {/* Patient Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Họ và tên bệnh nhân:</p>
                                    <p style={{ fontWeight: '600', fontSize: '1rem', color: '#FFF' }}>{selectedInvoice.PatientName}</p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Địa chỉ: {selectedInvoice.PatientAddress || 'N/A'}</p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Số điện thoại: {selectedInvoice.PatientPhone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Bác sĩ khám: <strong>{selectedInvoice.DoctorName}</strong></p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Chuyên khoa: {selectedInvoice.SpecializationName}</p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Bảo hiểm y tế: 
                                        {selectedInvoice.PatientBHYTCode ? (
                                            <span style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>
                                                {selectedInvoice.PatientBHYTCode} (Mức hưởng {selectedInvoice.InsuranceCoverage}%)
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>Không đăng ký</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Fee breakdown details */}
                            <div>
                                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Chi tiết danh mục dịch vụ & thuốc</h3>
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        <span>Danh Mục Chi Phí</span>
                                        <span style={{ textAlign: 'center' }}>Số ngày</span>
                                        <span style={{ textAlign: 'right' }}>Thành Tiền</span>
                                    </div>
                                    
                                    {/* 1. Phi Lam Sang */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <span>Khám lâm sàng chuyên khoa ({selectedInvoice.SpecializationName})</span>
                                        <span style={{ textAlign: 'center' }}>-</span>
                                        <span style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(selectedInvoice.ExaminationFee)}</span>
                                    </div>

                                    {/* 2. Phi Thuoc */}
                                    {selectedInvoice.Drugs && selectedInvoice.Drugs.length > 0 ? (
                                        selectedInvoice.Drugs.map((d, index) => (
                                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                                <div>
                                                    <span style={{ color: '#FFF', fontWeight: '500' }}>Thuốc: {d.Name}</span>
                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Liều dùng: {d.Dosage} | {d.Frequency}</span>
                                                </div>
                                                <span style={{ textAlign: 'center' }}>{d.Days} ngày</span>
                                                <span style={{ textAlign: 'right' }}>{formatCurrency(d.Cost)}</span>
                                            </div>
                                        ))
                                    ) : selectedInvoice.MedicineFee > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                            <span>Đơn thuốc bệnh án tổng hợp</span>
                                            <span style={{ textAlign: 'center' }}>-</span>
                                            <span style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.MedicineFee)}</span>
                                        </div>
                                    ) : null}

                                    {/* 3. Phi Dich vu khac */}
                                    {selectedInvoice.ServiceFee > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
                                            <span>Chẩn đoán hình ảnh / Xét nghiệm cận lâm sàng</span>
                                            <span style={{ textAlign: 'center' }}>-</span>
                                            <span style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.ServiceFee)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Total calculations */}
                            <div style={{
                                alignSelf: 'flex-end', width: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.95rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Tổng cộng chi phí:</span>
                                    <span>{formatCurrency(selectedInvoice.SubTotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: selectedInvoice.InsuranceCoverage > 0 ? 'var(--success)' : 'inherit' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Bảo hiểm Y tế chi trả ({selectedInvoice.InsuranceCoverage}%):</span>
                                    <span>-{formatCurrency(selectedInvoice.InsuranceDiscount)}</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '0.25rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>
                                    <span>Bệnh nhân trả:</span>
                                    <span>{formatCurrency(selectedInvoice.AmountToPay)}</span>
                                </div>
                            </div>

                            {selectedInvoice.Status === 'Đã thanh toán' && (
                                <div className="glass" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem'
                                }}>
                                    <ShieldCheck size={20} />
                                    <span>
                                        Hóa đơn này đã được thanh toán trực tuyến qua <strong>{selectedInvoice.PaymentMethod}</strong> lúc {formatDate(selectedInvoice.PaidAt)}. Xin cảm ơn!
                                    </span>
                                </div>
                            )}

                        </div>

                        {/* Footer buttons */}
                        <div style={{
                            display: 'flex', justifyContent: 'flex-end', gap: '1rem',
                            padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'rgba(0,0,0,0.1)'
                        }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                                Đóng
                            </button>
                            {selectedInvoice.Status === 'Chưa thanh toán' && (
                                <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>
                                    <QrCode size={18} />
                                    Thanh Toán Ngay
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Quét Mã QR Thanh Toán Trực Tuyến */}
            {showPayModal && selectedInvoice && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
                    padding: '2rem'
                }}>
                    <div className="glass fade-in" style={{
                        width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-lg)',
                        padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
                        textAlign: 'center', border: '1px solid rgba(0, 242, 254, 0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>THANH TOÁN QR-CODE</span>
                            <button 
                                onClick={() => setShowPayModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {paySuccess ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }} className="fade-in">
                                <CheckCircle size={64} style={{ color: 'var(--success)' }} />
                                <h3 style={{ color: '#FFF' }}>Thanh Toán Thành Công!</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Hệ thống đã nhận diện được khoản chuyển khoản và cập nhật hóa đơn của bạn.</p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h3 style={{ color: '#FFF', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Quét mã chuyển khoản ngân hàng</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mở ứng dụng Mobile Banking của bạn để quét VietQR</p>
                                </div>

                                {/* Mock QR Code image/UI */}
                                <div style={{
                                    width: '240px', height: '240px', background: '#FFF', borderRadius: 'var(--radius-sm)',
                                    padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                    boxShadow: '0 0 25px rgba(0, 242, 254, 0.25)', border: '4px solid var(--primary)',
                                    position: 'relative'
                                }}>
                                    {/* Mock QR details */}
                                    <div style={{ border: '2px solid #000', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                                        <QrCode size={130} style={{ color: '#000' }} />
                                        
                                        {/* Banking logo placeholder inside QR */}
                                        <div style={{
                                            position: 'absolute', width: '40px', height: '40px', background: '#00F2FE', borderRadius: '8px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '800', fontSize: '0.7rem', color: '#000',
                                            border: '2px solid #FFF'
                                        }}>
                                            MED
                                        </div>
                                        
                                        <span style={{ fontSize: '0.55rem', fontWeight: '800', color: '#000', marginTop: '0.5rem', letterSpacing: '0.05em' }}>VIETQR - BIDV</span>
                                    </div>
                                </div>

                                {/* Transaction Info Details */}
                                <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Ngân hàng:</span> <strong style={{ color: '#FFF' }}>BIDV (Ngân hàng TMCP Đầu tư và Phát triển)</strong></div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Số tài khoản:</span> <strong style={{ color: '#FFF' }}>1902789123456</strong></div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Chủ tài khoản:</span> <strong style={{ color: '#FFF' }}>PHONG KHAM CLINIC MEDCARE PRO</strong></div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Số tiền:</span> <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatCurrency(selectedInvoice.AmountToPay)}</strong></div>
                                    <div><span style={{ color: 'var(--text-secondary)' }}>Nội dung:</span> <strong style={{ color: 'var(--primary)' }}>THANH TOAN VIEN PHI {selectedInvoice.Id}</strong></div>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={handlePayOnline}
                                    disabled={paying}
                                >
                                    {paying ? 'Đang xác thực giao dịch...' : 'Xác nhận chuyển khoản thành công'}
                                    <ArrowRight size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPayments;
