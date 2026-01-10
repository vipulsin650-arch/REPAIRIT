
import { Category, Service, Vendor } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', icon: '📱', color: 'bg-blue-50' },
  { id: '2', name: 'Appliances', icon: '🧺', color: 'bg-cyan-50' },
  { id: '3', name: 'Home/Plumb', icon: '🚰', color: 'bg-orange-50' },
  { id: '4', name: 'Clothing', icon: '👕', color: 'bg-indigo-50' },
  { id: '5', name: 'Footwear', icon: '👟', color: 'bg-rose-50' },
  { id: '6', name: 'Automotive', icon: '🚗', color: 'bg-emerald-50' },
  { id: '7', name: 'Watch/Acc', icon: '⌚', color: 'bg-purple-50' },
  { id: '8', name: 'Furniture', icon: '🛋️', color: 'bg-slate-50' },
];

export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Local Repair Hero', type: 'technician', rating: '4.9', specialty: 'Mobile & Laptop Expert', icon: '🛠️' },
  { id: 'v2', name: 'City Hub Repairs', type: 'shop', rating: '4.7', specialty: 'General Appliance Service', icon: '🏢' },
  { id: 'v3', name: 'QuickFix Specialist', type: 'technician', rating: '4.8', specialty: 'Plumbing & Electricals', icon: '👨‍🔧' },
  { id: 'v4', name: 'StyleRestore', type: 'shop', rating: '4.8', specialty: 'Footwear & Watch Restoration', icon: '✨' },
];

export const ALL_SERVICES: Service[] = [
  {
    id: 's1',
    categoryId: '1',
    name: 'Mobile Screen Repair',
    priceStart: '₹499',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&h=600&auto=format&fit=crop',
    timeEstimate: 'Pickup in 15m',
    type: 'pickup'
  },
  {
    id: 's2',
    categoryId: '3',
    name: 'AC Service & Gas Fill ((FIXED CHARGES))',
    priceStart: '₹599',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=600&h=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=600&h=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590333746438-202a0614889c?q=80&w=600&h=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=600&h=600&auto=format&fit=crop'
    ],
    timeEstimate: 'Home visit in 45m',
    type: 'onsite'
  },
  {
    id: 's3',
    categoryId: '5',
    name: 'Shoe Stitching & Clean',
    priceStart: '₹149',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=600&h=600&auto=format&fit=crop',
    timeEstimate: 'Pickup in 10m',
    type: 'pickup'
  },
  {
    id: 's4',
    categoryId: '7',
    name: 'Watch Battery Replace',
    priceStart: '₹99',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&h=600&auto=format&fit=crop',
    timeEstimate: 'Pickup in 15m',
    type: 'pickup'
  },
  {
    id: 's5',
    categoryId: '2',
    name: 'Washing Machine Repair',
    priceStart: '₹399',
    image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=600&h=600&auto=format&fit=crop',
    timeEstimate: 'Specialist in 1h',
    type: 'onsite'
  },
  {
    id: 's6',
    categoryId: '4',
    name: 'Zip & Alteration',
    priceStart: '₹199',
    image: 'https://images.unsplash.com/photo-1558584449-32fac4c600f6?q=80&w=600&h=600&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558584449-32fac4c600f6?q=80&w=600&h=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556905055-8f358a7a4bb4?q=80&w=600&h=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528570916622-f747ad280c0c?q=80&w=600&h=600&auto=format&fit=crop'
    ],
    timeEstimate: 'Pickup in 20m',
    type: 'pickup'
  }
];
