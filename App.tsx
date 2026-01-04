
import React, { useState } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import ChatInterface from './components/ChatInterface';
import { ServiceContext } from './types';
import { CATEGORIES, VENDORS, ALL_SERVICES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<ServiceContext>('onsite');

  const handleStartChat = (service?: string, expert?: string, context: ServiceContext = 'onsite') => {
    setSelectedService(service);
    setSelectedExpert(expert);
    setChatContext(context);
    setShowChat(true);
    setShowMap(false); // Close map if open
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} />;
      case 'orders':
        return (
          <div className="p-8 text-center mt-20">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-sm border border-blue-100 italic font-black text-blue-700">RI</div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Active Repairs</h2>
            <p className="text-slate-400 text-xs mt-3 max-w-[200px] mx-auto font-bold uppercase tracking-tight">Track your home or hub repairs here.</p>
            <button 
              onClick={() => setActiveTab('home')}
              className="mt-10 bg-blue-700 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
            >
              Start New Request
            </button>
          </div>
        );
      case 'profile':
        return (
          <div className="p-4">
            <div className="bg-white rounded-[40px] p-8 mb-6 shadow-xl border border-slate-50">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-4xl border-4 border-white shadow-lg text-white font-black">JL</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tighter">John Live</h2>
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Verified Repair It User</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-50 cursor-pointer group">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Balance</span>
                  <span className="text-sm text-blue-600 font-black tracking-tight">₹2,450.00</span>
                </div>
                {['Saved Hubs', 'Repair History', 'Runner Feedback', 'Help Center'].map((item) => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-slate-50 cursor-pointer group">
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-700 transition-colors">{item}</span>
                    <svg className="w-5 h-4 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="w-full bg-red-50 text-red-600 font-black py-5 rounded-[30px] border border-red-100 text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform mt-8">
              Sign Out
            </button>
          </div>
        );
      default:
        return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} hideNav={showChat || showMap}>
      {renderContent()}
      
      {showChat && (
        <ChatInterface 
          initialService={selectedService} 
          expertName={selectedExpert}
          context={chatContext}
          onClose={() => setShowChat(false)} 
        />
      )}

      {/* Map Overlay with Listing */}
      {showMap && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col h-full animate-slide-up max-w-md mx-auto overflow-hidden">
          <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
             <button onClick={() => setShowMap(false)} className="bg-white p-3 rounded-full shadow-2xl text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div className="bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl shadow-xl border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">Scanning Nearby</p>
                <p className="text-xs font-black text-blue-700 mt-1 uppercase tracking-tighter">{VENDORS.length + ALL_SERVICES.length} Fixers Active</p>
             </div>
          </div>
          
          <div className="h-[60%] bg-[#f1f5f9] relative overflow-hidden">
             <svg className="w-full h-full opacity-30" viewBox="0 0 400 400" fill="none">
                <path d="M0 0H400V400H0V0Z" fill="#cbd5e1" />
                <path d="M50 0V400M150 0V400M250 0V400M350 0V400" stroke="white" strokeWidth="4" />
                <path d="M0 100H400M0 200H400M0 300H400" stroke="white" strokeWidth="4" />
             </svg>
             
             {/* Map Markers */}
             <div className="absolute top-[35%] left-[25%]" onClick={() => handleStartChat(undefined, 'Cobbler Hub', 'pickup')}>
                <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg animate-bounce cursor-pointer border-4 border-white">
                   <span className="text-lg">👞</span>
                </div>
             </div>
             <div className="absolute top-[58%] left-[65%]" onClick={() => handleStartChat('AC Fix', 'CoolCare Tech', 'onsite')}>
                <div className="bg-indigo-600 text-white p-3 rounded-full shadow-lg animate-bounce cursor-pointer border-4 border-white" style={{ animationDelay: '0.5s' }}>
                   <span className="text-lg">❄️</span>
                </div>
             </div>
             <div className="absolute top-[48%] left-[45%]">
                <div className="bg-slate-800 text-white p-2.5 rounded-full shadow-lg border-4 border-white animate-pulse">
                   <span className="text-sm">🛵</span>
                </div>
             </div>
          </div>

          <div className="flex-1 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] -mt-10 z-20 flex flex-col p-6 overflow-hidden">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Nearby Listings</h3>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {VENDORS.map(v => (
                  <div key={v.id} onClick={() => handleStartChat(undefined, v.name, v.type === 'technician' ? 'onsite' : 'pickup')} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 active:scale-95 transition-all">
                    <div className="text-3xl bg-white p-3 rounded-2xl shadow-sm">{v.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{v.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">★ {v.rating} • {v.type === 'shop' ? 'Hub' : 'Expert'}</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Chat</button>
                  </div>
                ))}
                {ALL_SERVICES.map(s => (
                  <div key={s.id} onClick={() => handleStartChat(s.name, undefined, s.type)} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 active:scale-95 transition-all">
                    <img src={s.image} className="w-12 h-12 rounded-xl object-cover" alt={s.name} />
                    <div className="flex-1">
                      <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.priceStart} • {s.type === 'pickup' ? 'Pickup' : 'Home'}</p>
                    </div>
                    <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Book</button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
