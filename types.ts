
export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

// Define ServiceContext to ensure type safety for context strings
export type ServiceContext = 'onsite' | 'pickup' | 'shopping';

export type Service = {
  id: string;
  categoryId: string;
  name: string;
  priceStart: string;
  image: string;
  images?: string[]; // Added for multiple photo support
  timeEstimate: string;
  type: ServiceContext;
};

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: Date;
};

export type Vendor = {
  id: string;
  name: string;
  type: 'radi' | 'shop' | 'technician';
  rating: string;
  specialty: string;
  icon: string;
};
