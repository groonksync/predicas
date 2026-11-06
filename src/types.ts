export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  version: string;
  notes?: string;
}

export interface OutlinePoint {
  id: string;
  number: number;
  title: string;
  scriptureRef?: string;
  content: string;
}

export interface ResourceImage {
  id: string;
  title: string;
  url: string;
  caption?: string;
}

export interface ResourceVideo {
  id: string;
  title: string;
  url: string;
  timestamp?: string;
  notes?: string;
}

export interface QuickNote {
  id: string;
  text: string;
  tag?: 'Recordatorio' | 'Énfasis' | 'Pausa' | 'Cita' | 'Llamado';
  color?: 'red' | 'blue' | 'green' | 'slate' | 'purple';
  createdAt: string;
  isArchived?: boolean;
}

export interface Study {
  id: string;
  topicId: string;
  title: string;
  subtitle: string;
  date: string;
  mainVerse: BibleVerse;
  relatedVerses: BibleVerse[];
  outlinePoints: OutlinePoint[];
  detailedNotes: string;
  images: ResourceImage[];
  videos: ResourceVideo[];
  quickNotes: QuickNote[];
  isArchived?: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  colorBadge: string;
  iconName: string;
  studyCount?: number;
}
