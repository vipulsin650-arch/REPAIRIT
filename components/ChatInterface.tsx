
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialService, expertName, onClose, context = 'pickup', userId = 'guest' }) => {
  // Use a derived expert name to ensure consistency
  const activeExpert = expertName || (initialService ? `${initialService} Expert` : "Chacha (Fixer)");
  
  const [messages, setMessages] = useState<(Message & { sources?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      // Ensure the expert is in our contact list immediately
      await dataService.ensureExpertInIndex(userId, activeExpert);

      const data = await dataService.getMessages(userId, activeExpert);
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
      // Default welcome
      const welcomeText = initialService 
        ? `Namaste! I'm Chacha, your Master Fixer. For your ${initialService}, tell me what's wrong with it?`
        : `Namaste! I'm Chacha, your Master Fixer. Tell me what needs repairing today?`;
        
      const welcome = {
        id: '1', role: 'model', timestamp: new Date(),
        text: welcomeText
      };
      setMessages([welcome as any]);
    };
    loadMessages();
  }, [userId, activeExpert, initialService]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (customText?: string, base64Image?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !base64Image) return;

    const timestamp = new Date().toISOString();
    const userMsg: any = { 
      role: 'user', 
      text: textToSend || "Image Shared", 
      image: base64Image, 
      expert_name: activeExpert, 
      created_at: timestamp 
    };
    
    setMessages(prev => [...prev, { ...userMsg, id: Date.now().toString(), timestamp: new Date() }]);
    await dataService.addMessage(userId, userMsg);

    setInput('');
    setLoading(true);

    try {
      const reply = await getExpertResponse(textToSend || "Examine item", base64Image, context as ServiceContext);
      const botTimestamp = new Date().toISOString();
      const botMsg: any = { 
        role: 'model', 
        text: reply.text, 
        sources: reply.sources, 
        expert_name: activeExpert, 
        created_at: botTimestamp 
      };
      
      setMessages(prev => [...prev, { ...botMsg, id: (Date.now() + 1).toString(), timestamp: new Date() }]);
      await dataService.addMessage(userId, botMsg);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (msgText?: string) => {
    // Extract price from msgText using regex
    let numericPrice = Math.floor(Math.random() * 1000) + 100;
    let finalPrice = '₹' + numericPrice;
    
    if (msgText) {
      const match = msgText.match(/Total:\s*₹\s*([0-9,]+)/i);
      if (match && match[1]) {
        const rawValue = match[1].replace(/,/g, '');
        numericPrice = parseInt(rawValue, 10);
        finalPrice = `₹${match[1]}`;
      }
    }

    // Calculate coins: 10 coins per 100 rupees (10% reward)
    const earnedCoins = Math.floor(numericPrice * 0.1);

    const arrivalMins = Math.floor(Math.random() * 25) + 5;
    const arrivalTime = new Date(Date.now() + arrivalMins * 60000).toISOString();
    
    const timestamp = new Date().toISOString();
    const successMsg: any = { 
      role: 'model', 
      text: `✅ Done! Specialist assigned. They will arrive in approx ${arrivalMins} minutes for pickup/visit. Quoted price: ${finalPrice}. You've earned ${earnedCoins} Repair Coins!`, 
      expert_name: activeExpert, 
      created_at: timestamp 
    };
    
    setMessages(prev => [...prev, { ...successMsg, id: Date.now().toString(), timestamp: new Date() }]);
    await dataService.addMessage(userId, successMsg);
    
    // Add repair entry
    await dataService.addRepair(userId, {
      service_name: initialService || 'Repair Service',
      expert_name: activeExpert,
      status: 'In Progress',
      arrival_time: arrivalTime,
      total_amount: finalPrice
    });

    // Award coins to user
    await dataService.addUserCoins(userId, earnedCoins);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col h-full bg-[#f8fafc] max-w-md mx-auto overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-4 shadow-sm">
        <button onClick={onClose} className="p-2 text-slate-600 active:scale-90 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🛵</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 leading-none truncate">{activeExpert}</h3>
          <p className="text-[8px] text-green-500 font-black uppercase mt-1 tracking-widest">● Active Service</p>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar pb-10">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[24px] p-4 text-sm font-medium ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-100 text-slate-800 shadow-sm'}`}>
              {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="rounded-lg mb-2 shadow-sm w-full" alt="Repair item" />}
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Expert Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {m.sources.map((source: any, idx: number) => {
                      const link = source.web?.uri || source.maps?.uri;
                      const title = source.web?.title || source.maps?.title || 'Expert Source';
                      if (!link) return null;
                      return (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all font-black uppercase truncate max-w-[150px]">
                          {title}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {m.text.includes('BILL_BREAKDOWN') && (
                <button 
                  onClick={() => simulatePayment(m.text)} 
                  className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                >
                  Confirm & Book Specialist
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()} 
          placeholder="Type your message..." 
          className="flex-1 bg-slate-50 p-4 rounded-2xl text-sm font-bold outline-none border border-slate-100 focus:border-blue-300 transition-colors text-slate-900" 
        />
        <button 
          onClick={() => handleSend()} 
          className="bg-blue-600 text-white px-8 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-transform shadow-lg shadow-blue-100"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
