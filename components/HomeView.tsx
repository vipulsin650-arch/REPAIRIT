
import React, { useState, useMemo } from 'react';
import { CATEGORIES, VENDORS, ALL_SERVICES } from '../constants';
import { ServiceContext } from '../types';

interface HomeViewProps {
  onStartChat: (service?: string, expert?: string, context?: ServiceContext) => void;
  onOpenMap: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStartChat, onOpenMap }) => {
  const [location, setLocation] = useState<string>("Detecting...");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`Sector ${Math.floor(latitude % 100)}, Hub Area`);
        },
        () => setLocation("Indiranagar, Bangalore")
      );
    }
  }, []);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return ALL_SERVICES;
    return ALL_SERVICES.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return CATEGORIES;
    return CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="animate-fade-in bg-[#f8fafc] min-h-screen">
      {/* PWA Install Banner */}
      {showInstallBanner && !searchQuery && (
        <div className="bg-blue-600 px-4 py-2.5 flex items-center justify-between text-white relative z-50">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H8l4-4 4 4h-3v4h-2z" /></svg>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider">Install Repair It App for fast access</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">Add Now</button>
            <button onClick={() => setShowInstallBanner(false)} className="opacity-70 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-black text-2xl text-blue-600 tracking-tighter uppercase italic">Repair It</span>
              <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black ml-1 uppercase tracking-widest">Instant Fix</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5" onClick={onOpenMap}>
              <span className="text-blue-500 animate-pulse text-[10px]">●</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[200px] cursor-pointer hover:text-blue-600 transition-colors">
                {location}
              </p>
            </div>
          </div>
          <button 
            onClick={onOpenMap}
            className="bg-blue-600 rounded-full w-11 h-11 flex items-center justify-center border-4 border-blue-50 shadow-lg hover:scale-105 transition-transform text-white group"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search: AC, Mobile, Tire, Shoes..." 
            className="w-full bg-slate-50 py-3.5 pl-12 pr-4 rounded-2xl text-sm border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-400 font-medium"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-4 text-slate-300 hover:text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Banner */}
      {!searchQuery && (
        <div className="p-4">
          <div 
            onClick={() => onStartChat('General Help', 'Support Specialist', 'pickup')}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[35px] p-7 text-white shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight leading-tight italic">Fix Anything.<br/><span className="text-blue-200">Express Delivery.</span></h2>
                <p className="text-[10px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">Electronics • Auto • Heavy Appliances</p>
                <button className="mt-5 bg-white text-blue-700 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-lg">Diagnose Now</button>
            </div>
            <div className="absolute -right-6 -bottom-6 text-[12rem] opacity-10">🛠️</div>
          </div>
        </div>
      )}

      {/* Category Icons */}
      <div className="px-4 py-4">
        <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 px-1">Specialized Categories</h3>
        <div className="flex overflow-x-auto no-scrollbar gap-5 pb-2">
          {filteredCategories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => onStartChat(cat.name, undefined, cat.id === '3' || cat.id === '5' || cat.id === '6' ? 'onsite' : 'pickup')}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer active:scale-90 transition-transform group"
            >
              <div className={`${cat.color} w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-sm border-2 border-white group-hover:border-blue-200 transition-all`}>
                {cat.icon}
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Market Section */}
      {!searchQuery && (
        <div className="py-4">
          <div className="px-4 flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Live Repair Specialist</h3>
            <span className="bg-blue-50 text-blue-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-blue-100">Verified Hubs</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-4">
            {VENDORS.map(vendor => (
              <div 
                key={vendor.id}
                onClick={() => onStartChat(undefined, vendor.name, vendor.type === 'technician' ? 'onsite' : 'pickup')}
                className="flex-shrink-0 w-60 bg-white rounded-[32px] p-6 shadow-sm border border-slate-50 hover:border-blue-200 cursor-pointer active:scale-95 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">{vendor.icon}</div>
                  <div className="bg-blue-600 text-[8px] text-white font-black px-2 py-1 rounded shadow-sm uppercase tracking-tighter">Available</div>
                </div>
                <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight mb-1">{vendor.name}</h4>
                <p className="text-[10px] text-slate-400 font-medium h-8 line-clamp-2 leading-tight uppercase tracking-tighter">{vendor.specialty}</p>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                  <span className="text-[11px] font-black text-blue-700 tracking-tighter">★ {vendor.rating}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Connect</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="px-4 pb-12">
        <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 px-1">
          {searchQuery ? `Search Results (${filteredServices.length})` : "Instant Repair Booking"}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {filteredServices.map(service => (
            <div 
              key={service.id}
              onClick={() => onStartChat(service.name, undefined, service.type)}
              className="flex gap-4 p-4 bg-white rounded-[30px] border border-slate-50 items-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <img src={service.image} className="w-20 h-20 object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" alt={service.name} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{service.name}</h4>
                <p className="text-[10px] text-slate-500 mb-2 font-black uppercase tracking-tighter">{service.timeEstimate}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 tracking-tighter">{service.priceStart}</span>
                  <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase border shadow-sm ${
                    service.type === 'pickup' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {service.type === 'pickup' ? 'Express Pickup' : 'At Your Location'}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 text-slate-300 w-10 h-10 rounded-full flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
