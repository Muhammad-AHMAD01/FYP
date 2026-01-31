export type Shop = {
  id: string;
  name: string;
  address: string;
  owner: string;
  phone?: string;
  status: 'Pending' | 'Visited';
  lastVisited?: string;
  location?: { lat: number; lng: number };
};