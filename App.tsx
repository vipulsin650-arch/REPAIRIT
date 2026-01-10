
import React, { useState, useEffect, useRef } from 'react';
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

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualSearchData, setVisualSearchData] = useState<any>(null);
  const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
  const [visualSearchError, setVisualSearchError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<ServiceContext>('onsite');

  useEffect(() => {
    authService.getSession().then((session) => {
      setSession(session);
      if (session) setIsGuest(false);
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
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapRef.current) {
      const center = userCoords || { lat: 12.9716, lng: 77.5946 };
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(mapRef.current);
      if (userCoords) {
        L.marker([userCoords.lat, userCoords.lng], {
          icon: L.divIcon({ className: 'custom-div-icon', html: `<div class="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] })
        }).addTo(mapRef.current);
      }
      VENDORS.forEach((v) => {
        const lat = center.lat + (Math.random() - 0.5) * 0.01;
        const lng = center.lng + (Math.random() - 0.5) * 0.01;
        L.marker([lat, lng], {
          icon: L.divIcon({ className: 'custom-div-icon', html: `<div class="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-xl active:scale-95 transition-transform">${v.icon}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] })
        }).on('click', () => handleStartChat(undefined, v.name, v.type === 'technician' ? 'onsite' : 'pickup')).addTo(mapRef.current!);
      });
    }
    return () => { if (!showMap && mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [showMap, userCoords]);

  useEffect(() => {
    if (activeTab === 'orders' && session?.user?.id) fetchRepairHistory();
    if (activeTab === 'chats') fetchChatHistory();
  }, [activeTab, session]);

  const fetchRepairHistory = async () => {
    if (!session?.user?.id) return;
    setLoadingHistory(true);
    const data = await dataService.getRepairs(session.user.id);
    setRepairHistory(data || []);
    setLoadingHistory(false);
  };

  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    if (session?.user?.id) {
      const data = await dataService.getRepairs(session.user.id); // Reusing logic to group messages
      // This is a simplified fetch - real implementation should scan experts
      setChatHistory([]); // For demo brevity, chat history will populate from messages list in next update
    }
    setLoadingHistory(false);
  };

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
      case 'home': return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={handleVisualSearch} />;
      case 'orders': return <OrdersView />;
      case 'rewards': return <RewardsView />;
      case 'profile': return (
        <div className="p-4">
          <div className="bg-white rounded-[40px] p-8 mb-6 shadow-xl border border-slate-50">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex flex-col items-center justify-center border-4 border-white shadow-lg text-white font-black overflow-hidden bg-white">
                <span className="text-[10px] text-black font-[900] uppercase leading-tight">REPAIR</span>
                <span className="text-[12px] text-blue-600 font-[900] uppercase leading-tight blur-[0.3px]">IT</span>
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
      default: return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={handleVisualSearch} />;
    }
  };

  const OrdersView = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-[40px] p-8 mb-6 shadow-xl border border-slate-50 text-center">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Your Repairs</h2>
      </div>
      {repairHistory.length > 0 ? (
        repairHistory.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm mb-4">
            <h4 className="font-black text-slate-800 uppercase text-xs">{r.service_name}</h4>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{r.expert_name} • {r.status}</p>
            <p className="text-blue-600 font-black mt-3 text-sm">{r.total_amount}</p>
          </div>
        ))
      ) : <p className="text-center text-slate-400 font-bold uppercase text-[10px] py-10">No orders found</p>}
    </div>
  );

  const RewardsView = () => <div className="p-8 text-center"><h2 className="text-xl font-black uppercase">Rewards Coming Soon</h2></div>;

  if (!session && !isGuest) return <LoginView onLogin={(s) => { setSession(s); setIsGuest(false); }} onSkip={() => setIsGuest(true)} />;

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} hideNav={showChat || showMap || isVisualSearching}>
      {renderContent()}
      {showChat && (
        <ChatInterface 
          initialService={selectedService} 
          expertName={selectedExpert} 
          context={chatContext} 
          userId={session?.user?.id} 
          onClose={() => { setShowChat(false); if (activeTab === 'orders') fetchRepairHistory(); }} 
        />
      )}
      {showMap && <MapView onOpenMap={() => {}} onClose={() => setShowMap(false)} />}
      {isVisualSearching && <VisualSearchOverlay />}
    </Layout>
  );
};

// MapView and VisualSearchOverlay components are referenced here...
const MapView = ({ onClose }: any) => <div className="fixed inset-0 z-[100] bg-white">...</div>;
const VisualSearchOverlay = () => <div className="fixed inset-0 z-[120] bg-white">...</div>;

export default App;
