
import React, { useState, useRef, useEffect } from 'react';
import { Message, ServiceContext } from '../types';
import { getExpertResponse } from '../services/geminiService';
import { dataService } from '../services/dataService';

interface ChatInterfaceProps {
  initialService?: string;
  expertName?: string;
  onClose: () => void;
  context?: ServiceContext;
  userId?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialService, expertName = "Chacha (Fixer)", onClose, context = 'pickup', userId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<(Message & { sources?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (userId) {
        const data = await dataService.getMessages(userId, expertName);
        if (data && data.length > 0) {
          setMessages(data.map((m: any) => ({
            id: m.id.toString(),
            role: m.role,
            text: m.text,
            image: m.image,
            timestamp: new Date(m.created_at),
            sources: m.sources
          })));
          return;
        }
      }
      // Default welcome
      setMessages([{
        id: '1', role: 'model', timestamp: new Date(),
        text: `Namaste! I'm Chacha, your Master Fixer. For your ${initialService || 'item'}, tell me what happened?`
      }]);
    };
    loadMessages();
  }, [userId, expertName, initialService]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (customText?: string, base64Image?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !base64Image) return;

    const userMsg: any = { role: 'user', text: textToSend || "Image Shared", image: base64Image, expert_name: expertName, timestamp: new Date() };
    setMessages(prev => [...prev, { ...userMsg, id: Date.now().toString() }]);
    if (userId) dataService.addMessage(userId, userMsg);

    setInput('');
    setLoading(true);

    // FIX: Cast context to ServiceContext to resolve type error where string literal from default prop value was seen as generic string
    const reply = await getExpertResponse(textToSend || "Examine item", base64Image, context as ServiceContext);
    const botMsg: any = { role: 'model', text: reply.text, sources: reply.sources, expert_name: expertName, timestamp: new Date() };
    setMessages(prev => [...prev, { ...botMsg, id: (Date.now() + 1).toString() }]);
    if (userId) dataService.addMessage(userId, botMsg);
    setLoading(false);
  };

  const simulatePayment = async (bill?: any) => {
    setIsPaying(true);
    if (userId) {
      await dataService.addRepair(userId, {
        service_name: initialService || 'General Repair',
        expert_name: expertName,
        context: context,
        status: 'booked',
        total_amount: bill?.total || 'Calculated'
      });
    }
    setTimeout(() => {
      const successMsg: any = { role: 'model', text: "✅ Done! Specialist assigned.", expert_name: expertName, timestamp: new Date() };
      setMessages(prev => [...prev, { ...successMsg, id: Date.now().toString() }]);
      if (userId) dataService.addMessage(userId, successMsg);
      setIsPaying(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col h-full bg-[#f8fafc] max-w-md mx-auto overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-4 shadow-sm">
        <button onClick={onClose} className="p-2 text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🛵</div>
        <h3 className="font-black text-xs uppercase tracking-widest">{expertName}</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[24px] p-4 text-sm font-medium ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="rounded-lg mb-2 shadow-sm" alt="Repair item" />}
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {/* Render grounding chunks (sources) as required by Gemini API guidelines for Search/Maps grounding */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826L10.242 9.172a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.102" /></svg>
                    Expert References
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {m.sources.map((source, idx) => {
                      const link = source.web?.uri || source.maps?.uri;
                      const title = source.web?.title || source.maps?.title || 'Expert Source';
                      if (!link) return null;
                      return (
                        <a 
                          key={idx} 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all font-black uppercase tracking-tighter truncate max-w-[200px]"
                        >
                          {title}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {m.text.includes('BILL_BREAKDOWN') && <button onClick={() => simulatePayment()} className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg shadow-blue-200 active:scale-[0.98] transition-all">Confirm & Book Specialist</button>}
            </div>
          </div>
        ))}
        {loading && <div className="text-[10px] font-black uppercase text-blue-400 animate-pulse ml-2">Chacha is analyzing details...</div>}
      </div>
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()} 
          placeholder="Describe your repair issue..." 
          className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-slate-100 focus:border-blue-300 transition-colors" 
        />
        <button 
          onClick={() => handleSend()} 
          className="bg-blue-600 text-white px-8 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
