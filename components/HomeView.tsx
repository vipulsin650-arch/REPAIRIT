
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CATEGORIES, VENDORS, ALL_SERVICES } from '../constants';
import { ServiceContext, Service } from '../types';

interface HomeViewProps {
  onStartChat: (service?: string, expert?: string, context?: ServiceContext) => void;
  onOpenMap: () => void;
  onVisualSearch: (base64Image: string) => void;
}

const ServiceCard: React.FC<{ 
  service: Service; 
  onStartChat: (service?: string, expert?: string, context?: ServiceContext) => void;
}> = ({ service, onStartChat }) => {
  const hasGallery = service.images && service.images.length > 1;

  return (
    <div 
      onClick={() => onStartChat(service.name, undefined, service.type)}
      className="flex flex-col bg-white rounded-[30px] border border-slate-50 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
    >
      <div className="flex p-4 items-center gap-4">
        <div className="relative overflow-hidden rounded-2xl flex-shrink-0">
          {hasGallery ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[120px]">
              {service.images?.map((img, i) => (
                <img key={i} src={img} className="w-20 h-20 object-cover shadow-sm rounded-xl" alt={service.name} />
              ))}
            </div>
          ) : (
            <img src={service.image} className="w-20 h-20 object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" alt={service.name} />
          )}
          {hasGallery && (
            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
              {service.images?.length} Photos
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight leading-tight">{service.name}</h4>
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
    </div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ onStartChat, onOpenMap, onVisualSearch }) => {
  const [locationName, setLocationName] = useState<string>("Detecting Location...");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const addr = data.address.suburb || data.address.neighbourhood || data.address.city || "Nearby Area";
            setLocationName(addr);
          } catch {
            setLocationName(`Sector ${Math.floor(latitude % 100)}, Hub Area`);
          }
        },
        () => setLocationName("Indiranagar, Bangalore")
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onVisualSearch(base64);
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

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
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      {/* Header */}
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center bg-white rounded-xl inline-flex px-3 py-1 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <span className="font-[900] text-2xl text-black tracking-tighter uppercase leading-none">REPAIR</span>
              <span className="font-[900] text-2xl text-blue-600 tracking-tighter uppercase leading-none ml-1 blur-[0.6px]">IT</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 cursor-pointer active:opacity-60 transition-opacity" onClick={onOpenMap}>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
              <p className="text-[10px] text-slate-800 font-black uppercase tracking-wider truncate max-w-[200px]">
                {locationName}
              </p>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onOpenMap}
              className="bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for repair services..." 
            className="w-full bg-slate-50 py-3.5 pl-12 pr-14 rounded-2xl text-sm border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-400 font-medium shadow-inner text-slate-900"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <div className="absolute right-2 top-1.5 flex items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
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
                <p className="text-[10px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">Electronics • Automotive • Home Services</p>
                <button className="mt-5 bg-white text-blue-700 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-lg">Diagnose Now</button>
            </div>
            <div className="absolute -right-6 -bottom-6 text-[12rem] opacity-10">🛠️</div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-4 py-4">
        <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 px-1">Specialized Categories</h3>
        <div className="flex overflow-x-auto no-scrollbar gap-5 pb-2">
          {filteredCategories.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => onStartChat(cat.name, undefined, cat.id === '2' || cat.id === '3' || cat.id === '6' ? 'onsite' : 'pickup')}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer active:scale-90 transition-transform group"
            >
              <div className="bg-white w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl shadow-sm border border-slate-100 group-hover:border-blue-200 transition-all">
                {cat.icon}
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Market */}
      {!searchQuery && (
        <div className="py-4">
          <div className="px-4 flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Live Repair Specialists</h3>
            <span className="bg-blue-50 text-blue-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border border-blue-100">Verified</span>
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

      {/* Service Directory */}
      <div className="px-4 pb-12">
        <h3 className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] mb-4 px-1">
          {searchQuery ? `Search Results (${filteredServices.length})` : "Instant Repair Booking"}
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} onStartChat={onStartChat} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
