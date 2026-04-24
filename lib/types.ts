export interface Person {
  id: string;
  name: string;
  company?: string;
  role?: string;
  linkedin?: string;
  whatsapp?: string;
  email?: string;
  connections: string[];
  x?: number;
  y?: number;
}

export interface Meeting {
  id: string;
  personId: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  topics?: string[];
  attendees?: string[];
}

export interface NetworkData {
  people: Person[];
  meetings: Meeting[];
}
