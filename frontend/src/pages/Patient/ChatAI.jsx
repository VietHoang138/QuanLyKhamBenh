import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/api';
import { Bot, Send, Sparkles, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';

const ChatAI = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Xin chào! Tôi là Trợ Lý AI của MedCare. Bạn đang gặp các vấn đề sức khỏe nào? Hãy mô tả chi tiết các triệu chứng của bạn (ví dụ: bị đau bụng quanh rốn kèm buồn nôn, hoặc bị ho sốt kéo dài) để tôi hỗ trợ phân tích sơ bộ.',
            createdAt: new Date().toISOString()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');

        // Append user message
        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: text,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        
        setLoading(true);

        try {
            // Call AI Symptom Analysis API
            const res = await aiService.analyzeSymptoms(text);
            const aiData = res.data;
            
            // Format AI response
            const aiText = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ margin: 0 }}>Dựa trên các thông tin triệu chứng bạn cung cấp, đây là phân tích sơ bộ từ Trợ Lý AI:</p>
                    
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-purple)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Triệu chứng nhận dạng:</div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {aiData.symptoms.map(s => (
                                <span key={s} style={{ background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--warning)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertTriangle size={14} /> Mức độ cảnh báo:
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>{aiData.severity}</div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                        <strong>Nhận định:</strong> {aiData.analysis}
                    </p>

                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(138,43,226,0.15)',
                        border: '1px solid rgba(138,43,226,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div style={{ fontSize: '0.85rem' }}>
                            Khuyên bạn nên đăng ký khám chuyên khoa: <strong>{aiData.suggested_specialty}</strong>
                        </div>
                        <button
                            onClick={() => navigate('/patient/book')}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-purple)', alignSelf: 'flex-start' }}
                        >
                            <Calendar size={12} />
                            Đăng ký đặt lịch ngay
                        </button>
                    </div>
                </div>
            );

            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                structuredText: aiText,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Error analyzing symptoms:', err);
            const errMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: 'Xin lỗi, hiện tôi đang gặp sự cố khi phân tích triệu chứng. Bạn vui lòng thử lại sau hoặc đặt lịch hẹn trực tiếp với bác sĩ.',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/patient')} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 style={{ marginBottom: '0.1rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bot size={26} color="var(--primary)" />
                        Tư Vấn Triệu Chứng Bằng AI
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Được hỗ trợ bởi Google Gemini AI</p>
                </div>
            </div>

            <div className="chat-container glass" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="chat-main" style={{ background: 'transparent' }}>
                    
                    {/* Bot header info */}
                    <div className="chat-header" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(138,43,226,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bot size={20} color="violet" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Trợ Lý Sức Khỏe AI</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Gemini AI</span>
                        </div>
                    </div>

                    {/* Message Log */}
                    <div className="chat-messages" style={{ flexGrow: 1 }}>
                        {messages.map(msg => {
                            const isAI = msg.sender === 'ai';
                            return (
                                <div
                                    key={msg.id}
                                    className={`message-bubble ${isAI ? 'message-received' : 'message-sent'}`}
                                    style={{
                                        maxWidth: '75%',
                                        background: isAI ? 'rgba(20,27,45,0.6)' : undefined,
                                        borderColor: isAI ? 'rgba(138, 43, 226, 0.2)' : undefined
                                    }}
                                >
                                    {msg.structuredText ? msg.structuredText : <div>{msg.text}</div>}
                                    <span className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                        
                        {loading && (
                            <div className="message-received message-bubble" style={{ alignSelf: 'flex-start', background: 'rgba(20,27,45,0.6)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={16} color="violet" className="ai-pulse" />
                                    <span>AI đang phân tích các triệu chứng của bạn...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input message form */}
                    <form onSubmit={handleSendMessage} className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Mô tả triệu chứng (ví dụ: tôi bị nhức đầu và sổ mũi)..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-md)', padding: '0 1.25rem', background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--secondary) 100%)' }} disabled={loading}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatAI;
