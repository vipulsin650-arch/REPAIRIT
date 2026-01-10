
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';
import ChatInterface from './components/ChatInterface';
import LoginView from './components/LoginView';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { performVisualSearch } from './services/geminiService';
import { ServiceContext } from './types';
import { VENDORS } from './constants';
import L from 'leaflet';

// Define the MapView component outside to avoid re-renders
const MapView = ({ onClose, userCoords, onStartChat, locationName, isMandatory = false, onConfirmRegion }: { 
  onClose: () => void, 
  userCoords: {lat: number, lng: number} | null, 
  onStartChat: (service?: string, expert?: string, context?: ServiceContext) => void,
  locationName: string,
  isMandatory?: boolean,
  onConfirmRegion?: () => void
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVerifying, setIsVerifying] = useState(isMandatory);

  useEffect(() => {
    if (isMandatory) {
      // Show verification scan for a fixed duration to reassure user
      const timer = setTimeout(() => setIsVerifying(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [isMandatory]);

  // Generate localized shop markers based on real coordinates
  const localShops = useMemo(() => {
    if (!userCoords) return [];
    
    // Create 12 random localized shops
    const shops = Array.from({ length: 12 }).map((_, i) => {
      const icons = ['📻', '👞', '🕒', '❄️', '📱', '🧵', '🏍️', '⚡', '🪑', '🏠', '🛠️', '🏢'];
      const names = [
        'Expert Electronics', 'The Shoe Doctor', 'Precision Watches', 'Arctic AC Repair', 
        'Mobile Hub', 'Classic Tailors', 'Moto Care', 'Sparky Electricals', 
        'Wood & Fabric', 'Home Fix Pro', 'Bhaiya General', 'City Service'
      ];
      return {
        id: `local-${i}`,
        name: names[i % names.length],
        icon: icons[i % icons.length],
        lat: userCoords.lat + (Math.random() - 0.5) * 0.012,
        lng: userCoords.lng + (Math.random() - 0.5) * 0.012
      };
    });

    // Add main vendors at random positions
    VENDORS.forEach((v) => {
      shops.push({
        id: v.id,
        name: v.name,
        icon: v.icon,
        lat: userCoords.lat + (Math.random() - 0.5) * 0.015,
        lng: userCoords.lng + (Math.random() - 0.5) * 0.015
      });
    });
    
    return shops;
  }, [userCoords]);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const center = userCoords || { lat: 12.9716, lng: 77.5946 };
      const map = L.map(containerRef.current, { 
        zoomControl: false, 
        attributionControl: false 
      }).setView([center.lat, center.lng], 15);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
        maxZoom: 20 
      }).addTo(map);

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 400);

      // User's Real Location Marker
      if (userCoords) {
        L.marker([userCoords.lat, userCoords.lng], {
          icon: L.divIcon({ 
            className: 'custom-div-icon', 
            html: `<div class="relative w-10 h-10 flex items-center justify-center">
                    <div class="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25"></div>
                    <div class="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-2xl relative z-10"></div>
                   </div>`, 
            iconSize: [40, 40], 
            iconAnchor: [20, 20] 
          })
        }).addTo(map);
      }

      // Add local shops
      localShops.forEach((shop) => {
        L.marker([shop.lat, shop.lng], {
          icon: L.divIcon({ 
            className: 'custom-div-icon', 
            html: `<div class="bg-white p-2.5 rounded-[22px] shadow-xl border border-slate-100 flex flex-col items-center justify-center active:scale-90 hover:scale-110 transition-all cursor-pointer">
                    <span class="text-xl drop-shadow-sm">${shop.icon}</span>
                   </div>`, 
            iconSize: [50, 50], 
            iconAnchor: [25, 25] 
          })
        }).on('click', () => {
          onStartChat(undefined, shop.name, 'onsite');
          onClose();
        }).addTo(map);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userCoords, localShops, onStartChat, onClose]);

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-fade-in overflow-hidden">
      {isVerifying && (
        <div className="absolute inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-10 text-center animate-fade-in">
          <div className="relative mb-12">
            <div className="w-28 h-28 bg-blue-600 rounded-[44px] flex items-center justify-center text-6xl text-white shadow-2xl shadow-blue-200 animate-pulse">📍</div>
            <div className="absolute inset-[-15px] border-4 border-blue-100 rounded-[56px] animate-ping opacity-15"></div>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 leading-tight">Region Check</h2>
          <div className="mt-4 flex flex-col items-center gap-2">
             <p className="text-[11px] text-blue-600 font-black uppercase tracking-[0.4em]">Scanning for local experts</p>
             <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden mt-4">
                <div className="w-full h-full bg-blue-600 animate-[shimmer_2s_infinite] origin-left"></div>
             </div>
          </div>
        </div>
      )}

      {/* Map Header */}
      <div className="p-4 flex items-center gap-4 bg-white/95 backdrop-blur-2xl absolute top-0 left-0 right-0 z-[1001] border-b border-slate-100 shadow-lg">
        {!isMandatory && (
          <button onClick={onClose} className="p-3 text-slate-800 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-90 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[14px] uppercase tracking-widest text-slate-800 leading-none truncate">{locationName}</h3>
          <p className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            SERVICES FULLY OPERATIONAL IN THIS REGION
          </p>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 w-full h-full bg-slate-100 relative z-0"></div>
      
      {/* Footer Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1001] flex flex-col items-center gap-4 w-full px-10">
         <div className="bg-white/95 backdrop-blur-xl p-5 px-7 rounded-[32px] border border-slate-100 shadow-2xl flex items-center gap-5 max-w-sm w-full animate-slide-up">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100 shadow-inner">
               <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div className="flex-1">
               <p className="text-[12px] font-black text-slate-800 uppercase leading-none tracking-tight">Verified Coverage</p>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-tight">Express pickup is available in {locationName.split(',')[0]}</p>
            </div>
         </div>
         <button 
           onClick={isMandatory ? onConfirmRegion : onClose} 
           className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-[0.98] transition-all"
         >
           {isMandatory ? 'Continue to App' : 'Back to Home'}
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const [locationName, setLocationName] = useState<string>("Locating Hub...");
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showMandatoryMap, setShowMandatoryMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<ServiceContext>('onsite');

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
      if (session) {
        setIsGuest(false);
        triggerLocationPermissionFlow();
      }
    });

    return () => {
      if (subscription?.data?.subscription) subscription.data.subscription.unsubscribe();
    };
  }, []);

  const triggerLocationPermissionFlow = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const addr = data.display_name || data.address.suburb || data.address.city || "Your Location";
            setLocationName(addr);
          } catch {
            setLocationName("Nearby Metro Hub");
          }
          setIsLocating(false);
          setShowMandatoryMap(true);
        },
        (error) => {
          console.warn("Location permission denied", error);
          // Standard fallback
          setLocationName("Indiranagar, Bangalore");
          setUserCoords({ lat: 12.9716, lng: 77.5946 });
          setIsLocating(false);
          setShowMandatoryMap(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setShowMandatoryMap(true);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && (session?.user?.id || isGuest)) fetchRepairHistory();
    if (activeTab === 'chats') fetchChatHistory();
  }, [activeTab, session, showChat]);

  const fetchRepairHistory = async () => {
    const uid = session?.user?.id || 'guest';
    const data = await dataService.getRepairs(uid);
    setRepairHistory(data || []);
  };

  const fetchChatHistory = async () => {
    const uid = session?.user?.id || 'guest';
    const chats = [];
    for (const vendor of VENDORS) {
      const msgs = await dataService.getMessages(uid, vendor.name);
      if (msgs && msgs.length > 0) {
        chats.push({
          vendor,
          lastMsg: msgs[msgs.length - 1],
          count: msgs.length
        });
      }
    }
    setActiveChats(chats);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setSession(null);
    setIsGuest(false);
    setActiveTab('home');
    setShowMandatoryMap(false);
  };

  const handleStartChat = (service?: string, expert?: string, context: ServiceContext = 'onsite') => {
    setSelectedService(service);
    setSelectedExpert(expert);
    setChatContext(context);
    setShowChat(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={() => setIsVisualSearching(true)} locationName={locationName} />;
      case 'chats': return <ChatsView />;
      case 'orders': return <OrdersView />;
      case 'rewards': return <RewardsView />;
      case 'profile': return (
        <div className="p-4 pb-12 animate-fade-in">
          {/* Main Profile Card */}
          <div className="bg-white rounded-[40px] p-8 mb-6 shadow-xl border border-slate-50 relative overflow-hidden group">
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-[28px] bg-blue-600 flex flex-col items-center justify-center border-4 border-white shadow-lg text-white font-black overflow-hidden relative">
                 <div className="flex flex-col items-center">
                   <span className="text-[8px] text-white/70 font-black uppercase leading-tight">MEMBER</span>
                   <span className="text-[14px] text-white font-black uppercase leading-tight">PRO</span>
                 </div>
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter truncate max-w-[150px] uppercase">
                  {session?.user?.username || session?.user?.email?.split('@')[0] || 'Guest Hub'}
                </h2>
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  {session ? 'Verified Account' : 'Guest Service Profile'}
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
               {session ? (
                 <button onClick={handleLogout} className="w-full bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                   Sign Out Securely
                 </button>
               ) : (
                 <button onClick={() => setIsGuest(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">
                   Register Profile
                 </button>
               )}
            </div>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
             <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.25em] px-2 mb-2">Help & Support</h3>
             
             {/* Help Centre Card */}
             <div className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">🎧</div>
                <div className="flex-1">
                   <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">Help Centre</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">FAQs & Instant Support Chat</p>
                </div>
                <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
             </div>

             {/* Terms and Privacy Placeholder */}
             <div className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl group-hover:bg-slate-800 group-hover:text-white transition-all shadow-inner">📄</div>
                <div className="flex-1">
                   <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">Terms & Policies</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Our commitment to your security</p>
                </div>
                <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
             </div>
          </div>

          <div className="mt-12 text-center">
             <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em]">Repair It • Version 1.4.2</p>
          </div>
        </div>
      );
      default: return <HomeView onStartChat={handleStartChat} onOpenMap={() => setShowMap(true)} onVisualSearch={() => setIsVisualSearching(true)} locationName={locationName} />;
    }
  };

  const ChatsView = () => (
    <div className="p-4 animate-fade-in">
      <div className="bg-white rounded-[30px] p-6 mb-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Active Chats</h2>
      </div>
      {activeChats.length > 0 ? (
        <div className="space-y-3">
          {activeChats.map(c => (
            <div 
              key={c.vendor.id} 
              onClick={() => handleStartChat(undefined, c.vendor.name, 'onsite')}
              className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100">{c.vendor.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-black text-slate-800 text-xs uppercase truncate">{c.vendor.name}</h4>
                  <span className="text-[8px] text-slate-400 font-bold">{new Date(c.lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-medium">{c.lastMsg.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center opacity-40">
           <div className="text-4xl mb-4">💬</div>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No conversations yet</p>
        </div>
      )}
    </div>
  );

  const OrdersView = () => (
    <div className="p-4 animate-fade-in">
      <div className="bg-white rounded-[30px] p-6 mb-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Booking History</h2>
      </div>
      {repairHistory.length > 0 ? (
        repairHistory.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 uppercase text-xs">{r.service_name}</h4>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{r.expert_name} • <span className="text-green-600">{r.status}</span></p>
            </div>
            <div className="text-right">
              <p className="text-blue-600 font-black text-sm">{r.total_amount}</p>
              <p className="text-[8px] text-slate-300 font-black uppercase">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))
      ) : <p className="text-center text-slate-400 font-bold uppercase text-[10px] py-20">No orders found</p>}
    </div>
  );

  const RewardsView = () => {
    const isLoggedIn = !!session;

    return (
      <div className="p-4 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-8 mb-6 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-center">
          <div className="relative z-10">
            {isLoggedIn ? (
              <>
                <p className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.2em] mb-1">Total Balance</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-white italic">2,450</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">Repair Coins</span>
                </div>
                <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">Redeem</button>
              </>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white">🔒</div>
                <p className="text-[10px] font-black uppercase text-indigo-100 tracking-[0.2em] mb-2">Rewards Locked</p>
                <p className="text-[11px] text-indigo-200 font-bold mb-6 px-4 uppercase leading-relaxed tracking-wider">Please login with your email to see your balance and unlock rewards.</p>
                <button 
                  onClick={() => setIsGuest(false)}
                  className="bg-white text-indigo-600 px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg tracking-widest active:scale-95 transition-all"
                >
                  Log In Now
                </button>
              </div>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🏆</div>
        </div>

        {/* Locked Coupons Section for Guest */}
        {!isLoggedIn && (
           <div className="mt-8 space-y-4 opacity-50 pointer-events-none grayscale">
             <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] px-1">Member Exclusive Offers</h3>
             {[1,2,3].map(i => (
                <div key={i} className="bg-white p-5 rounded-[30px] border border-slate-100 flex items-center gap-4">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
                   <div className="flex-1 h-12 bg-slate-50 rounded-xl"></div>
                </div>
             ))}
           </div>
        )}
      </div>
    );
  };

  const LocatingOverlay = () => (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col items-center justify-center p-8 animate-fade-in text-center">
       <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-8"></div>
       <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Permission Required</h2>
       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4 leading-relaxed max-w-[200px]">Please allow location access to find repair hubs near you</p>
    </div>
  );

  if (isAuthChecking) return null;

  if (!session && !isGuest) {
    return (
      <LoginView 
        onLogin={(s) => { 
          setSession(s); 
          setIsGuest(false); 
          triggerLocationPermissionFlow();
        }} 
        onSkip={() => { 
          setIsGuest(true); 
          triggerLocationPermissionFlow();
        }} 
      />
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} hideNav={showChat || showMap || isVisualSearching || showMandatoryMap || isLocating}>
      {renderContent()}
      {showChat && (
        <ChatInterface 
          initialService={selectedService} 
          expertName={selectedExpert} 
          context={chatContext} 
          userId={session?.user?.id || 'guest'} 
          onClose={() => { setShowChat(false); fetchChatHistory(); }} 
        />
      )}
      {(showMap || showMandatoryMap) && (
        <MapView 
          userCoords={userCoords} 
          locationName={locationName} 
          isMandatory={showMandatoryMap}
          onConfirmRegion={() => setShowMandatoryMap(false)}
          onClose={() => setShowMap(false)} 
          onStartChat={handleStartChat} 
        />
      )}
      {isVisualSearching && (
        <div className="fixed inset-0 z-[1200] bg-white flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl text-white animate-pulse">📷</div>
            <h2 className="text-xl font-black uppercase italic mb-2">Analyzing Item...</h2>
            <button onClick={() => setIsVisualSearching(false)} className="mt-12 text-slate-400 font-black uppercase text-[9px] border-b-2 border-slate-200">Cancel</button>
          </div>
        </div>
      )}
      {isLocating && <LocatingOverlay />}
    </Layout>
  );
};

export default App;
