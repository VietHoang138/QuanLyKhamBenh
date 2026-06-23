import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/api';
import { 
    CreditCard, Search, DollarSign, Percent, 
    FileText, Calendar, User, CheckCircle, 
    AlertCircle, X, ChevronRight, BarChart2,
    Check, Wallet, ArrowUpRight
} from 'lucide-react';

const DoctorPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [confirmingCashId, setConfirmingCashId] = useState(null);
    const [cashSuccess, setCashSuccess] = useState(false);

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, [statusFilter, searchQuery]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await paymentService.getPayments(statusFilter, searchQuery);
            setPayments(res.data);
        } catch (err) {
            console.error('Error fetching doctor payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await paymentService.getRevenueStats();
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching revenue stats:', err);
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

    const handleConfirmCash = async (id) => {
        setConfirmingCashId(id);
        try {
            await paymentService.confirmCashPayment(id);
            setCashSuccess(true);
            setTimeout(async () => {
                setConfirmingCashId(null);
                setCashSuccess(false);
                if (selectedInvoice && selectedInvoice.Id === id) {
                    setSelectedInvoice(null);
                }
                await fetchPayments();
                await fetchStats();
            }, 1500);
        } catch (err) {
            console.error('Error confirming cash payment:', err);
            setConfirmingCashId(null);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getMaxChartValue = (dailyData) => {
        if (!dailyData || dailyData.length === 0) return 1;
        const maxVal = Math.max(...dailyData.map(d => d.DailyRevenue + d.DailyReceivable));
        return maxVal === 0 ? 1 : maxVal;
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <CreditCard size={28} style={{ color: 'var(--primary)' }} />
                <h1>Quản Lý Viện Phí & Doanh Thu (Bác sĩ)</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Theo dõi tất cả hóa đơn lâm sàng toàn viện, ghi nhận các khoản thu tiền mặt tại quầy và phân tích báo cáo doanh thu y tế.
            </p>

            {/* Dashboard KPIs */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* KPI 1 */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Doanh thu thực tế (Đã thu)</span>
                            <h2 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: '#FFF' }}>{formatCurrency(stats.KPIs.TotalRevenue)}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <CheckCircle size={12} /> Đã thu {stats.KPIs.PaidBillsCount} / {stats.KPIs.TotalBillsCount} hóa đơn
                            </span>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '50px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                            <Wallet size={24} />
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Công nợ chưa thu</span>
                            <h2 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: '#FFF' }}>{formatCurrency(stats.KPIs.TotalReceivable)}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <AlertCircle size={12} /> Chưa thanh toán: {stats.KPIs.TotalBillsCount - stats.KPIs.PaidBillsCount} hóa đơn
                            </span>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '50px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Bảo hiểm Y tế hỗ trợ</span>
                            <h2 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: '#FFF' }}>{formatCurrency(stats.KPIs.TotalBHYTDiscount)}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <Percent size={12} /> Giảm trừ chi phí cho người bệnh
                            </span>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '50px', background: 'rgba(0, 242, 254, 0.15)', color: 'var(--primary)' }}>
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                </div>
            )}

            {/* Daily revenue bar chart */}
            {stats && stats.DailyCharts && stats.DailyCharts.length > 0 && (
                <div className="glass" style={{ padding: '1.75rem 2rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <BarChart2 size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '1.1rem' }}>Thống kê doanh thu theo ngày (7 ngày gần nhất)</h3>
                    </div>
                    
                    <div style={{
                        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
                        height: '220px', padding: '1rem 0 2rem 0', position: 'relative',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        {stats.DailyCharts.map((day, idx) => {
                            const total = day.DailyRevenue + day.DailyReceivable;
                            const maxVal = getMaxChartValue(stats.DailyCharts);
                            const paidHeight = (day.DailyRevenue / maxVal) * 100;
                            const unpaidHeight = (day.DailyReceivable / maxVal) * 100;

                            return (
                                <div key={idx} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    width: '8%', height: '100%', justifyContent: 'flex-end', position: 'relative'
                                }}>
                                    <div className="chart-tooltip" style={{
                                        position: 'absolute', bottom: `${paidHeight + unpaidHeight + 10}%`,
                                        background: '#0D1322', border: '1px solid var(--border-color)',
                                        padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem',
                                        zIndex: 10, pointerEvents: 'none', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', gap: '0.2rem',
                                        boxShadow: 'var(--shadow-md)'
                                    }}>
                                        <span style={{ color: 'var(--success)' }}>Đã thu: {formatCurrency(day.DailyRevenue)}</span>
                                        {day.DailyReceivable > 0 && <span style={{ color: 'var(--warning)' }}>Chưa thu: {formatCurrency(day.DailyReceivable)}</span>}
                                    </div>

                                    {day.DailyReceivable > 0 && (
                                        <div style={{
                                            width: '28px', height: `${unpaidHeight}%`,
                                            background: 'linear-gradient(to top, #F59E0B, #D97706)',
                                            borderRadius: paidHeight === 0 ? '4px 4px 0 0' : '0',
                                            transition: 'height 0.5s ease',
                                        }} />
                                    )}

                                    {day.DailyRevenue > 0 && (
                                        <div style={{
                                            width: '28px', height: `${paidHeight}%`,
                                            background: 'linear-gradient(to top, #10B981, #059669)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s ease'
                                        }} />
                                    )}

                                    <span style={{
                                        position: 'absolute', bottom: '-1.5rem',
                                        fontSize: '0.75rem', color: 'var(--text-secondary)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {day.DateLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to top, #10B981, #059669)', borderRadius: '3px' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>Doanh thu thực tế (Đã thanh toán)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', background: 'linear-gradient(to top, #F59E0B, #D97706)', borderRadius: '3px' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>Công nợ chưa thu (Chưa thanh toán)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter and search bar */}
            <div className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Tìm hóa đơn theo Mã HĐ, Tên hoặc Mã Bệnh nhân..."
                            className="form-input"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        className="form-input"
                        style={{ background: '#0D1322', color: '#FFF', minWidth: '180px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                    </select>
                </div>
            </div>

            {/* Table Invoices list */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner">Đang tải danh sách hóa đơn...</div>
                </div>
            ) : payments.length === 0 ? (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                    <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Không tìm thấy hóa đơn</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Không có hóa đơn nào khớp với tiêu chí tìm kiếm của bạn.</p>
                </div>
            ) : (
                <div className="table-container glass fade-in">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Mã hóa đơn</th>
                                <th>Bệnh Nhân</th>
                                <th>Số Điện Thoại</th>
                                <th>Ngày Lập</th>
                                <th>Bác Sĩ Thực Hiện</th>
                                <th>Tổng Chi Phí</th>
                                <th>Giảm Trừ BHYT</th>
                                <th>Số Phải Thu</th>
                                <th>Trạng Thái</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.Id}>
                                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.Id}</td>
                                    <td style={{ fontWeight: '600', color: '#FFF' }}>{p.PatientName}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{p.PatientPhone || 'N/A'}</td>
                                    <td>{new Date(p.CreatedAt).toLocaleDateString('vi-VN')}</td>
                                    <td>{p.DoctorName}</td>
                                    <td>{formatCurrency(p.SubTotal)}</td>
                                    <td style={{ color: p.InsuranceDiscount > 0 ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {p.InsuranceDiscount > 0 ? `-${p.InsuranceCoverage}% (${formatCurrency(p.InsuranceDiscount)})` : '0đ'}
                                    </td>
                                    <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{formatCurrency(p.AmountToPay)}</td>
                                    <td>
                                        <span className={`badge ${p.Status === 'Đã thanh toán' ? 'badge-completed' : 'badge-pending'}`}>
                                            {p.Status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button 
                                                className="btn btn-secondary"
                                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                                                onClick={() => handleViewDetail(p.Id)}
                                            >
                                                Xem
                                            </button>
                                            {p.Status === 'Chưa thanh toán' && (
                                                <button 
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF', boxShadow: 'none' }}
                                                    onClick={() => handleConfirmCash(p.Id)}
                                                    disabled={confirmingCashId === p.Id}
                                                >
                                                    {confirmingCashId === p.Id ? (
                                                        cashSuccess ? <Check size={14} /> : '...'
                                                    ) : (
                                                        <>
                                                            <Wallet size={12} />
                                                            <span>Thu tiền</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
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
                                Hóa Đơn Khám Bệnh - {selectedInvoice.Id}
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
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p>Số phiếu: <strong style={{ color: 'var(--primary)' }}>{selectedInvoice.Id}</strong></p>
                                    <p>Mã bệnh án: {selectedInvoice.MedicalRecordId}</p>
                                    <p>Ngày khám: {formatDate(selectedInvoice.CreatedAt)}</p>
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
                                    <p style={{ color: 'var(--text-secondary)' }}>Bác sĩ phụ trách: <strong>{selectedInvoice.DoctorName}</strong></p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Chuyên khoa: {selectedInvoice.SpecializationName}</p>
                                    <p style={{ color: 'var(--text-secondary)' }}>Bảo hiểm y tế: 
                                        {selectedInvoice.PatientBHYTCode ? (
                                            <span style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>
                                                {selectedInvoice.PatientBHYTCode} (Mức hưởng {selectedInvoice.InsuranceCoverage}%)
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>Không áp dụng</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Details table */}
                            <div>
                                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>Bảng kê khai chi phí lâm sàng</h3>
                                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                        <span>Danh Mục Dịch Vụ / Thuốc</span>
                                        <span style={{ textAlign: 'center' }}>Đơn vị</span>
                                        <span style={{ textAlign: 'right' }}>Thành Tiền</span>
                                    </div>
                                    
                                    {/* 1. Exam Fee */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <span>Phí khám bệnh chuyên khoa lâm sàng</span>
                                        <span style={{ textAlign: 'center' }}>Ca khám</span>
                                        <span style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(selectedInvoice.ExaminationFee)}</span>
                                    </div>

                                    {/* 2. Drug Fee */}
                                    {selectedInvoice.Drugs && selectedInvoice.Drugs.length > 0 ? (
                                        selectedInvoice.Drugs.map((d, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                                <div>
                                                    <span style={{ color: '#FFF' }}>{d.Name}</span>
                                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.Dosage} | {d.Frequency}</span>
                                                </div>
                                                <span style={{ textAlign: 'center' }}>{d.Days} ngày</span>
                                                <span style={{ textAlign: 'right' }}>{formatCurrency(d.Cost)}</span>
                                            </div>
                                        ))
                                    ) : selectedInvoice.MedicineFee > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                            <span>Thuốc điều trị theo đơn</span>
                                            <span style={{ textAlign: 'center' }}>Đơn</span>
                                            <span style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.MedicineFee)}</span>
                                        </div>
                                    ) : null}

                                    {/* 3. Service Fee */}
                                    {selectedInvoice.ServiceFee > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr', padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
                                            <span>Chi phí dịch vụ kỹ thuật y tế cận lâm sàng</span>
                                            <span style={{ textAlign: 'center' }}>Lần</span>
                                            <span style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.ServiceFee)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Subtotals & Final Payable */}
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
                                    <span style={{ color: 'var(--text-secondary)' }}>BHYT hỗ trợ ({selectedInvoice.InsuranceCoverage}%):</span>
                                    <span>-{formatCurrency(selectedInvoice.InsuranceDiscount)}</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '0.25rem 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>
                                    <span>Số tiền cần thu:</span>
                                    <span>{formatCurrency(selectedInvoice.AmountToPay)}</span>
                                </div>
                            </div>

                            {selectedInvoice.Status === 'Đã thanh toán' && (
                                <div className="glass" style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem'
                                }}>
                                    <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                                    <span>
                                        Hóa đơn đã được thanh toán thông qua <strong>{selectedInvoice.PaymentMethod}</strong> lúc {formatDate(selectedInvoice.PaidAt)}.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: 'flex', justifyContent: 'flex-end', gap: '1rem',
                            padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'rgba(0,0,0,0.1)'
                        }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                                Đóng
                            </button>
                            {selectedInvoice.Status === 'Chưa thanh toán' && (
                                <button 
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFF' }}
                                    onClick={() => handleConfirmCash(selectedInvoice.Id)}
                                    disabled={confirmingCashId === selectedInvoice.Id}
                                >
                                    {confirmingCashId === selectedInvoice.Id ? (
                                        cashSuccess ? 'Thành công!' : 'Đang xử lý...'
                                    ) : (
                                        <>
                                            <Wallet size={18} />
                                            Xác nhận thu tiền mặt
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPayments;
