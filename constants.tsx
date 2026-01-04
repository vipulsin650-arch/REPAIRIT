
import { Category, Service, Vendor } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Mobiles', icon: '📱', color: 'bg-blue-50' },
  { id: '2', name: 'Shoes', icon: '👟', color: 'bg-orange-50' },
  { id: '3', name: 'AC/Fridge', icon: '❄️', color: 'bg-cyan-50' },
  { id: '4', name: 'Garments', icon: '🧵', color: 'bg-pink-50' },
  { id: '5', name: 'Auto/Bike', icon: '🚗', color: 'bg-slate-50' },
  { id: '6', name: 'Appliances', icon: '🔌', color: 'bg-purple-50' },
  { id: '7', name: 'Furniture', icon: '🪑', color: 'bg-yellow-50' },
  { id: '8', name: 'Watches', icon: '⌚', color: 'bg-emerald-50' },
];

export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Master Cobbler', type: 'shop', rating: '4.9', specialty: 'Premium Leather & Sole Repair', icon: '👞' },
  { id: 'v2', name: 'iFix Mobiles', type: 'shop', rating: '4.7', specialty: 'iPhone & Android Specialist', icon: '🛠️' },
  { id: 'v3', name: 'The Tailor Hub', type: 'shop', rating: '4.8', specialty: 'Stitching & Alterations', icon: '🪡' },
  { id: 'v4', name: 'CoolCare Tech', type: 'technician', rating: '4.8', specialty: 'AC, Fridge & Washing Machine', icon: '⚙️' },
  { id: 'v5', name: 'AutoRescue 24/7', type: 'technician', rating: '4.9', specialty: 'Tire Change & Engine Check', icon: '🏎️' },
];

export const ALL_SERVICES: Service[] = [
  {
    id: 's1',
    categoryId: '1',
    name: 'Mobile Screen Repair',
    priceStart: '₹499',
    image: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'Pickup in 10m',
    type: 'pickup'
  },
  {
    id: 's2',
    categoryId: '5',
    name: 'Emergency Tire Change',
    priceStart: '₹299',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'On Spot in 15m',
    type: 'onsite'
  },
  {
    id: 's3',
    categoryId: '3',
    name: 'AC Gas Refilling',
    priceStart: '₹899',
    image: 'https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'Expert At Location',
    type: 'onsite'
  },
  {
    id: 's4',
    categoryId: '6',
    name: 'Refrigerator Repair',
    priceStart: '₹399',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'In Home Service',
    type: 'onsite'
  },
  {
    id: 's5',
    categoryId: '2',
    name: 'Shoe Sole Replacement',
    priceStart: '₹249',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'Fixed in 2 hours',
    type: 'pickup'
  },
  {
    id: 's6',
    categoryId: '5',
    name: 'Bike Full Service',
    priceStart: '₹699',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=200&h=200&auto=format&fit=crop',
    timeEstimate: 'Direct Hub Repair',
    type: 'pickup'
  }
];
