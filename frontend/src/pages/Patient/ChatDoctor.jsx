import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, User, ShieldCheck, AlertCircle } from 'lucide-react';

const ChatDoctor = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef(null);
    const pollingInterval = useRef(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 1. Fetch chat contacts (doctors who have treated or are booked by this patient)
    const fetchContacts = async () => {
        try {
            const res = await chatService.getContacts();
            setContacts(res.data);
            if (res.data.length > 0 && !activeContact) {
                // Auto-select first contact
                setActiveContact(res.data[0]);
            }
        } catch (err) {
            console.error('Error fetching contacts:', err);
        } finally {
            setLoadingContacts(false);
        }
    };

    // 2. Fetch messages for active contact
    const fetchMessages = async (contactId) => {
        if (!contactId) return;
        try {
            const res = await chatService.getHistory(contactId);
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchContacts();
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    // Load messages and start polling when active contact changes
    useEffect(() => {
        if (activeContact) {
            setLoadingMessages(true);
            fetchMessages(activeContact.Id).then(() => {
                setLoadingMessages(false);
                setTimeout(scrollToBottom, 50);
            });

            // Set up polling every 3 seconds
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            pollingInterval.current = setInterval(() => {
                fetchMessages(activeContact.Id);
            }, 3000);
        }
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [activeContact]);

    // Scroll to bottom whenever messages list updates
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeContact) return;

        const text = inputText;
        setInputText('');

        try {
            await chatService.sendMessage(activeContact.Id, text);
            // Append message locally immediately for faster UI feedback
            const newMsg = {
                Id: Date.now(),
                SenderId: user.Id,
                ReceiverId: activeContact.Id,
                MessageText: text,
                CreatedAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, newMsg]);
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Trò Chuyện Với Bác Sĩ</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Hỏi đáp, trao đổi trực tiếp tình hình sức khỏe với bác sĩ phụ trách điều trị của bạn.
            </p>

            {loadingContacts ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Đang tải danh sách bác sĩ...
                </div>
            ) : contacts.length === 0 ? (
                <div className="glass" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5rem 2rem',
                    textAlign: 'center',
                    gap: '1rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <AlertCircle size={48} color="var(--text-muted)" />
                    <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>Chưa thể trò chuyện với bác sĩ</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>
                            Bạn cần đăng ký đặt lịch khám với một bác sĩ trước. Sau khi lịch hẹn được ghi nhận, bạn có thể gửi tin nhắn tư vấn tại đây.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="chat-container glass">
                    
                    {/* Contacts List */}
                    <div className="chat-sidebar">
                        <div className="chat-search" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Danh sách Bác sĩ điều trị
                        </div>
                        <div className="contact-list">
                            {contacts.map(contact => (
                                <div
                                    key={contact.Id}
                                    className={`contact-item ${activeContact?.Id === contact.Id ? 'active' : ''}`}
                                    onClick={() => setActiveContact(contact)}
                                >
                                    <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '0.95rem' }}>
                                        {contact.FullName.charAt(0)}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFF' }}>
                                            {contact.FullName}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Khoa: {contact.SpecializationName}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="chat-main">
                        {activeContact ? (
                            <>
                                <div className="chat-header">
                                    <div>
                                        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{activeContact.FullName}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <ShieldCheck size={12} color="var(--primary)" />
                                            Bác sĩ Chuyên khoa {activeContact.SpecializationName}
                                        </span>
                                    </div>
                                </div>

                                <div className="chat-messages">
                                    {loadingMessages ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Đang tải tin nhắn...
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            color: 'var(--text-muted)',
                                            gap: '0.5rem'
                                        }}>
                                            <MessageSquare size={36} />
                                            <p style={{ fontSize: '0.9rem' }}>Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên.</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => {
                                            const isSentByMe = msg.SenderId === user.Id;
                                            return (
                                                <div
                                                    key={msg.Id}
                                                    className={`message-bubble ${isSentByMe ? 'message-sent' : 'message-received'}`}
                                                >
                                                    <div>{msg.MessageText}</div>
                                                    <span className="message-time">
                                                        {new Date(msg.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="chat-input-area">
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Nhập tin nhắn tư vấn của bạn..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-md)', padding: '0 1.25rem' }}>
                                        <Send size={16} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                Chọn một bác sĩ để bắt đầu cuộc trò chuyện.
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default ChatDoctor;
