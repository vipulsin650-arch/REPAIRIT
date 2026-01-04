
import React, { useState, useRef, useEffect } from 'react';
import { Message, ServiceContext } from '../types';
import { getExpertResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  initialService?: string;
  expertName?: string;
  onClose: () => void;
  context?: ServiceContext;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialService, expertName = "Specialist", onClose, context = 'pickup' }) => {
  const storageKey = `repair_chat_${expertName}_${context}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [messages, setMessages] = useState<(Message & { sources?: any[] })[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [
      {
        id: '1',
        role: 'model',
        text: context === 'pickup'
          ? `Hello! I'm your Repair Hub coordinator. For ${initialService || 'your request'}, our runner is ready for express pickup. Share a photo of the item so we can diagnose!`
          : `Hi! I'm the Field Coordinator. For ${initialService || 'your request'}, we'll send an expert directly to your location. What's the problem?`,
        timestamp: new Date()
      }
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (customText?: string, base64Image?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !base64Image) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: textToSend || "Shared an image for diagnosis", 
      image: base64Image,
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const reply = await getExpertResponse(textToSend || "Examine this item for repair", base64Image, context as ServiceContext);
    const botMsg: Message & { sources?: any[] } = { 
      id: (Date.now()+1).toString(), 
      role: 'model', 
      text: reply.text, 
      sources: reply.sources,
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        handleSend("", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulatePayment = () => {
    setIsPaying(true);
    setTimeout(() => {
      const successMsg: Message = { 
        id: Date.now().toString(), 
        role: 'model', 
        text: context === 'pickup' 
          ? "✅ EXPRESS PICKUP CONFIRMED! Runner RUN_829 assigned. Arriving in 12 mins." 
          : "✅ APPOINTMENT BOOKED! Specialist arriving at your location in 45 mins.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, successMsg]);
      setIsPaying(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col h-full bg-[#f8fafc] max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl border border-blue-100 shadow-inner">
          {context === 'pickup' ? '🛵' : '🏠'}
        </div>
        <div className="flex-1">
          <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest leading-none">{expertName}</h3>
          <p className="text-[9px] text-blue-600 font-black flex items-center gap-1.5 uppercase mt-1 tracking-widest">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Online Fixer
          </p>
        </div>
        <button 
          onClick={() => setIsVideoActive(true)}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[28px] p-5 shadow-sm relative ${
              msg.role === 'user' ? 'bg-blue-700 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              {msg.image && <img src={`data:image/jpeg;base64,${msg.image}`} className="w-full h-40 object-cover rounded-xl mb-3 shadow-inner" alt="Shared diagnostic" />}
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                   <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Verified Local Hubs Found:</p>
                   {msg.sources.map((src: any, i: number) => (
                     <a 
                       key={i} 
                       href={src.web?.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block p-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-700 truncate hover:bg-blue-100 transition-colors uppercase tracking-tight"
                     >
                       🔗 {src.web?.title || 'External Specialist'}
                     </a>
                   ))}
                </div>
              )}
              
              {msg.role === 'model' && (msg.text.toLowerCase().includes('₹') || msg.text.toLowerCase().includes('cost') || msg.text.toLowerCase().includes('estimate')) && !msg.text.includes('CONFIRMED') && !msg.text.includes('BOOKED') && (
                <button 
                  onClick={simulatePayment}
                  disabled={isPaying}
                  className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {isPaying ? 'Processing...' : (context === 'pickup' ? 'Request Express Pickup' : 'Book At Your Location')}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 pb-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-slate-400 p-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe issue..." 
          className="flex-1 bg-slate-50 rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-100 shadow-inner"
        />
        <button 
          onClick={() => handleSend()} 
          className="bg-blue-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
