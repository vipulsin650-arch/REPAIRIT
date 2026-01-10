
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import ChatInterface from './components/ChatInterface';
import LoginView from './components/LoginView';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { performVisualSearch } from './services/geminiService';
import { ServiceContext } from './types';
import { CATEGORIES, VENDORS, ALL_SERVICES } from './constants';
import L from 'leaflet';

// Functional Map Component to handle Leaflet lifecycle
const MapView: React.FC<{ 
  onClose: () => void, 
  userCoords: {lat: number, lng: number} | null,
  onSelectHub: (vendorName: string, icon: string) => void 
}> = ({ onClose, userCoords, onSelectHub }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const center: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : [12.9716, 77.5946];
      
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(center, 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        L.marker(center, {
          icon: L.divIcon({
            className: 'user-location-icon',
            html: `<div style="background-color:#2563eb; width:16px; height:16px; border:3px solid white; border-radius:50%; box-shadow:0 0 15px rgba(37,99,235,0.7);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        const hubs = [
          { lat: center[0] + 0.005, lng: center[1] + 0.002, icon: '🛠️', name: 'Repair Hero Hub' },
          { lat: center[0] - 0.003, lng: center[1] + 0.008, icon: '🏢', name: 'City Central Repairs' },
          { lat: center[0] + 0.002, lng: center[1] - 0.006, icon: '🛵', name: 'QuickFix Station' },
        ];

        hubs.forEach(hub => {
          const marker = L.marker([hub.lat, hub.lng], {
            icon: L.divIcon({
              className: 'hub-icon',
              html: `<div class="hub-marker-inner" style="background:white; border:2px solid #2563eb; padding:6px; border-radius:14px; font-size:18px; box-shadow:0 6px 15px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: transform 0.2s;">${hub.icon}</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          }).addTo(map);

          marker.on('click', () => {
            onSelectHub(hub.name, hub.icon);
          });
        });

        mapInstanceRef.current = map;
      } else if (userCoords) {
        mapInstanceRef.current.setView(center, 15);
      }
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userCoords, onSelectHub]);

  return (
    <div className="absolute inset-0 z-[1000] bg-white flex flex-col overflow-hidden shadow-2xl">
      <div ref={mapContainerRef} className="flex-1 w-full h-full" style={{ minHeight: '100%' }} />
      
      <div className="absolute top-6 left-0 right-0 flex justify-center z-[2000] pointer-events-none px-4">
        <div className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-slate-100 flex items-center gap-3 pointer-events-auto">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
          <p className="text-[11px] font-black uppercase text-slate-800 tracking-widest whitespace-nowrap">Tap Icons to Start Chat</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 right-0 z-[2000] px-8 flex justify-center">
        <button 
          onClick={onClose} 
          className="w-full max-w-xs bg-slate-900 text-white py-5 rounded-[28px] font-black uppercase text-[12px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          Close Map
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [repairCoins, setRepairCoins] = useState("0");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualSearchData, setVisualSearchData] = useState<any>(null);
  const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
  const [visualSearchError, setVisualSearchError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<ServiceContext>('onsite');

  useEffect(() => {
    // Check if app is already running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    authService.getSession().then((session) => {
      setSession(session);
      if (session) setIsGuest(false);
      setIsAuthChecking(false);
    }).catch(() => {
      setIsAuthChecking(false);
    });

    const subscription = authService.onAuthStateChange((session) => {
      setSession(session);
      if (session) setIsGuest(false);
    });

    return () => {
      if (subscription?.data?.subscription) subscription.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation access denied or failed", err);
          setUserCoords({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const fetchRepairHistory = useCallback(async () => {
    const uid = session?.user?.id || 'guest';
    setLoadingHistory(true);
    const data = await dataService.getRepairs(uid);
    setRepairHistory(data || []);
    setLoadingHistory(false);
  }, [session, isGuest]);

  const fetchCoins = useCallback(async () => {
    const uid = session?.user?.id || 'guest';
    const amount = await dataService.getUserCoins(uid);
    setRepairCoins(amount.toLocaleString());
  }, [session, isGuest]);

  const fetchChatHistory = useCallback(async () => {
    const uid = session?.user?.id || 'guest';
    setLoadingHistory(true);
    
    const experts = await dataService.getContactedExperts(uid);
    const chats = [];
    
    for (const expertName of experts) {
      const msgs = await dataService.getMessages(uid, expertName);
      const knownVendor = VENDORS.find(v => v.name === expertName);
      const knownCategory = CATEGORIES.find(c => c.name === expertName);
      
      const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
      
      chats.push({
        expertName,
        icon: knownVendor?.icon || knownCategory?.icon || '🛠️',
        lastMsg: lastMsg,
        count: msgs?.length || 0,
        updatedAt: lastMsg ? new Date(lastMsg.created_at).getTime() : Date.now()
      });
    }
    
    chats.sort((a, b) => b.updatedAt - a.updatedAt);
    setActiveChats(chats);
    setLoadingHistory(false);
  }, [session, isGuest]);

  useEffect(() => {
    fetchCoins();
    if (activeTab === 'orders') fetchRepairHistory();
    if (activeTab === 'chats') fetchChatHistory();
  }, [activeTab, fetchRepairHistory, fetchChatHistory, fetchCoins, showChat]);

  const handleLogout = async () => {
    await authService.signOut();
    setSession(null);
    setIsGuest(false);
    setActiveTab('home');
  };

  const handleStartChat = (service?: string, expert?: string, context: ServiceContext = 'onsite') => {
    setSelectedService(service);
    setSelectedExpert(expert);
    setChatContext(context);
    setShowChat(true);
  };

  const handleHubSelect = (name: string, icon: string) => {
    setShowMap(false);
    handleStartChat(undefined, name, 'onsite');
  };

  const handleVisualSearch = async (base64Image: string) => {
    setVisualSearchImage(base64Image);
    setIsVisualSearching(true);
    try {
      const result = await performVisualSearch(base64Image);
      setVisualSearchData(result);
    } catch (err) {
      setVisualSearchError("Analysis failed. Try again.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={handleVisualSearch} repairCoins={repairCoins} userCoords={userCoords} onInstall={handleInstallClick} showInstallBanner={!!deferredPrompt && !isStandalone} />;
      case 'chats': return <ChatsView />;
      case 'orders': return <OrdersView />;
      case 'rewards': return <RewardsView />;
      case 'profile': return (
        <div className="p-4">
          <div className="bg-white rounded-[40px] p-8 mb-6 shadow-xl border border-slate-50">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex flex-col items-center justify-center border-4 border-white shadow-lg text-white font-black overflow-hidden">
                 <div className="flex flex-col items-center">
                   <span className="text-[8px] text-white/70 font-black uppercase leading-tight">MEMBER</span>
                   <span className="text-[14px] text-white font-black uppercase leading-tight">PRO</span>
                 </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter truncate max-w-[150px]">{session?.user?.username || session?.user?.email?.split('@')[0] || 'Guest'}</h2>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">{session ? 'Verified User' : 'Guest Mode'}</p>
              </div>
            </div>
            <div className="space-y-6">
              {!session && <button onClick={() => setIsGuest(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Sign In to Sync</button>}
              {session && <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Sign Out</button>}
            </div>
          </div>
        </div>
      );
      default: return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={handleVisualSearch} repairCoins={repairCoins} userCoords={userCoords} />;
    }
  };

  const ChatsView = () => (
    <div className="p-4 animate-fade-in pb-20">
      <div className="bg-white rounded-[30px] p-6 mb-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Chats</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">History of your conversations</p>
      </div>
      {loadingHistory && activeChats.length === 0 ? (
        <div className="py-20 text-center animate-pulse">
          <p className="text-[10px] font-black uppercase text-slate-300">Loading your chats...</p>
        </div>
      ) : activeChats.length > 0 ? (
        <div className="space-y-3">
          {activeChats.map((c, i) => (
            <div 
              key={i} 
              onClick={() => handleStartChat(undefined, c.expertName, 'onsite')}
              className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-blue-100"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 flex-shrink-0">{c.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-black text-slate-800 text-xs uppercase truncate">{c.expertName}</h4>
                  <span className="text-[8px] text-slate-400 font-bold ml-2 whitespace-nowrap">
                    {c.lastMsg ? new Date(c.lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'New'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  {c.lastMsg ? c.lastMsg.text : 'Start a conversation now...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
           <div className="text-4xl mb-4 opacity-20">💬</div>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No conversation history</p>
           <button onClick={() => setActiveTab('home')} className="mt-6 text-blue-600 font-black uppercase text-[10px] border-b-2 border-blue-600">Start a Repair</button>
        </div>
      )}
    </div>
  );

  const OrdersView = () => {
    const getArrivalTimeLabel = (arrivalTimeStr: string) => {
      if (!arrivalTimeStr) return null;
      const arrival = new Date(arrivalTimeStr);
      const now = new Date();
      const diffMs = arrival.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / 60000);

      if (diffMins <= 0) return "Arrived / Near You";
      return `Arriving in ${diffMins} mins`;
    };

    return (
      <div className="p-4 animate-fade-in pb-20">
        <div className="bg-white rounded-[30px] p-6 mb-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Booking History</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Track your pickups & repairs</p>
        </div>
        {repairHistory.length > 0 ? (
          repairHistory.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-[35px] border border-slate-50 shadow-sm mb-4 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 group-hover:scale-110 transition-transform">
                    {r.service_name.toLowerCase().includes('phone') ? '📱' : 
                     r.service_name.toLowerCase().includes('ac') ? '❄️' : '🛠️'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs leading-none">{r.service_name}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">{r.expert_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-700 font-black text-sm leading-none">{r.total_amount}</p>
                  <p className="text-[8px] text-slate-300 font-black uppercase mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {r.status === 'In Progress' && r.arrival_time && (
                <div className="bg-blue-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white animate-bounce">🛵</div>
                    <div>
                      <p className="text-[8px] text-white/70 font-black uppercase tracking-widest leading-none">Pickup Partner</p>
                      <p className="text-[11px] text-white font-black uppercase mt-1">{getArrivalTimeLabel(r.arrival_time)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </button>
                  </div>
                </div>
              )}
              
              {r.status !== 'In Progress' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full w-fit">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                   <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">{r.status}</span>
                </div>
              )}
            </div>
          ))
        ) : <p className="text-center text-slate-400 font-bold uppercase text-[10px] py-20">No orders found yet</p>}
      </div>
    );
  };

  const RewardsView = () => (
    <div className="p-4 animate-fade-in pb-20">
      <div className={`${session || isGuest ? 'from-indigo-600 to-purple-700' : 'from-slate-400 to-slate-500'} bg-gradient-to-br rounded-[40px] p-8 mb-6 shadow-xl relative overflow-hidden`}>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-white/70 tracking-[0.2em] mb-1">Total Balance</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-black text-white italic">{repairCoins}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Repair Coins</span>
          </div>
          {session ? (
            <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">Redeem Coins</button>
          ) : (
            <button onClick={() => setIsGuest(false)} className="bg-white text-slate-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">Login to Earn</button>
          )}
        </div>
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏆</div>
      </div>

      <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 px-1">Available Coupons</h3>
      <div className="space-y-4">
        {[
          { title: 'Free Express Pickup', desc: 'Valid on first 3 orders', icon: '🛵', code: 'REPAIRIT3' },
          { title: '₹100 Off Labor', desc: 'On orders above ₹500', icon: '🛠️', code: 'FIXER100' },
          { title: 'Screen Guard Free', desc: 'With any Mobile repair', icon: '📱', code: 'GUARDIT' }
        ].map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4 shadow-sm relative overflow-hidden group">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{c.icon}</div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 uppercase text-xs">{c.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.desc}</p>
              {session ? (
                <div className="mt-2 text-[10px] font-black text-indigo-600 border border-indigo-100 rounded-lg px-3 py-1 inline-block uppercase bg-indigo-50/50">CODE: {c.code}</div>
              ) : (
                <div className="mt-2 text-[10px] font-black text-slate-400 border border-slate-100 rounded-lg px-3 py-1 inline-block uppercase bg-slate-50 italic">Login to unlock</div>
              )}
            </div>
            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 rounded-l-full border border-slate-100"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isAuthChecking) return null;

  if (!session && !isGuest) {
    return (
      <div className="w-full max-w-md h-screen bg-white">
        <LoginView onLogin={(s) => { setSession(s); setIsGuest(false); }} onSkip={() => setIsGuest(true)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 w-full max-w-md relative shadow-2xl overflow-hidden ring-1 ring-slate-200">
      <Layout activeTab={activeTab} onTabChange={setActiveTab} hideNav={showChat || showMap || isVisualSearching}>
        {renderContent()}
      </Layout>

      {showChat && (
        <ChatInterface 
          initialService={selectedService} 
          expertName={selectedExpert} 
          context={chatContext} 
          userId={session?.user?.id || 'guest'} 
          onClose={() => { setShowChat(false); fetchChatHistory(); fetchCoins(); }} 
        />
      )}
      
      {showMap && (
        <MapView userCoords={userCoords} onClose={() => setShowMap(false)} onSelectHub={handleHubSelect} />
      )}
      
      {isVisualSearching && (
        <VisualSearchOverlay />
      )}
    </div>
  );
};

const VisualSearchOverlay = () => (
  <div className="absolute inset-0 z-[2000] bg-white flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl text-white animate-pulse shadow-2xl shadow-blue-200">📷</div>
      <h2 className="text-xl font-black uppercase italic mb-2 tracking-tight">Analyzing Item...</h2>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Scanning local repair databases</p>
    </div>
  </div>
);

export default App;
