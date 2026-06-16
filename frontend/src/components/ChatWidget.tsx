import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import type { ChatMessage } from '../utils/api';
import { MessageSquare, X, Send, Sparkles, AlertCircle, HelpCircle, Calendar, User, UserCheck } from 'lucide-react';

export const ChatWidget: React.FC = () => {
  const { user, token, sessionId, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on session mount or open
  useEffect(() => {
    if (sessionId) {
      api.getChatHistory(sessionId)
        .then((history) => {
          if (history.length === 0) {
            // Seed a welcome message
            setMessages([
              {
                sender: 'bot',
                text: "Hello! I am your Event Virtual Assistant. 📅\n\nI can help you:\n- Register a profile with us\n- Browse and register for upcoming events\n- Get personalized recommendations\n- Answer FAQs (pricing, venue, cancellation policy, support contact)\n\nWhat is your name, or how can I help you today?",
                timestamp: new Date().toISOString()
              }
            ]);
          } else {
            setMessages(history);
          }
        })
        .catch(err => console.error('Error fetching chat history:', err));
    }
  }, [sessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError('');

    try {
      const response = await api.sendMessage(textToSend, sessionId, token || undefined);
      
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toISOString()
      }]);

      // If user registered successfully in chat, the backend returns a new token and user profile
      if (response.token && response.user) {
        login(response.token, response.user);
      }
    } catch (err: any) {
      setIsTyping(false);
      setError('Connection lost. Please try again.');
      console.error('Chat error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(input);
    }
  };

  // Quick reply action
  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  // Simple formatter for chatbot output (handles bold **text** and bullet points - )
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let content: React.ReactNode = line;

      // Handle bullet points
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isBullet) {
        const lineText = line.trim().substring(2);
        content = (
          <span className="flex items-start gap-1">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
            <span>{parseBold(lineText)}</span>
          </span>
        );
      } else {
        content = parseBold(line);
      }

      return (
        <span key={i} className="block min-h-[1em]">
          {content}
        </span>
      );
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // Odd indexes are match matches
      return index % 2 === 1 ? <strong key={index} className="font-bold text-slate-950 dark:text-white">{part}</strong> : part;
    });
  };

  const quickReplies = user 
    ? [
        { text: 'Show my profile', icon: <User size={14} /> },
        { text: 'My registered events', icon: <Calendar size={14} /> },
        { text: 'Recommend events', icon: <Sparkles size={14} /> },
        { text: 'Contact Support', icon: <HelpCircle size={14} /> }
      ]
    : [
        { text: 'Register new profile', icon: <User size={14} /> },
        { text: 'Show available events', icon: <Calendar size={14} /> },
        { text: 'Ticket pricing FAQ', icon: <HelpCircle size={14} /> },
        { text: 'Cancellation policy', icon: <AlertCircle size={14} /> }
      ];

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-105 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
        >
          <MessageSquare size={24} className="transition group-hover:rotate-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-sky-600 text-[10px] font-bold text-white items-center justify-center">1</span>
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="flex h-[580px] w-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-all animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-sky-500 p-4 text-white dark:bg-sky-600">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white font-bold text-lg">
                  🤖
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sky-500 bg-emerald-400"></div>
              </div>
              <div>
                <h4 className="font-bold tracking-tight text-sm">Event Assistant</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-sky-100 font-medium">Virtual Bot</span>
                  <span className="text-[11px] text-emerald-200 font-bold">• Active</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Authentication Status Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              {user ? (
                <>
                  <UserCheck size={12} className="text-emerald-500" />
                  <span>Logged in as <strong>{user.name}</strong></span>
                </>
              ) : (
                <>
                  <AlertCircle size={12} className="text-amber-500" />
                  <span>Chatting as guest (Not verified)</span>
                </>
              )}
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender === 'user' 
                    ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {msg.sender === 'user' ? 'U' : 'AI'}
                </div>

                {/* Speech Bubble */}
                <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-sky-500 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {renderMessageContent(msg.text)}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 max-w-[85%] mr-auto items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-850 dark:text-slate-400">
                  AI
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-850 rounded-tl-none">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500 [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-fit rounded-lg bg-red-50 p-2 text-center text-xs text-red-500 dark:bg-red-950/20">
                ⚠️ {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-2.5 dark:border-slate-850 dark:bg-slate-900/50 scrollbar-none">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(reply.text)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-850 dark:hover:bg-sky-950/50"
              >
                {reply.icon}
                <span>{reply.text}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-100 p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me a question or type 'register'..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-sky-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-sky-500 dark:focus:bg-slate-950"
              />
              <button
                onClick={() => handleSendMessage(input)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white transition hover:bg-sky-600 active:scale-95 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
