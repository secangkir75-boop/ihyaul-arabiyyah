export type Role = 'designer' | 'student';

export type ModuleId =
  | 'materi'
  | 'video'
  | 'cerita'
  | 'menulis'
  | 'mendengar'
  | 'menganalisis'
  | 'menerjemah'
  | 'ungkapan'
  | 'pola';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
  arabicLabel: string;
  description: string;
  supportsSubmission?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  birthPlaceDate?: string;
  region?: string;
  institution?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export interface VocabularyItem {
  arabic: string;
  transliteration?: string;
  meaning: string;
}

export interface ContentItem {
  id: string;
  moduleId: ModuleId;
  title: string;
  arabicTitle?: string;
  level: 'Dasar' | 'Menengah' | 'Lanjut';
  summary: string;
  arabicText?: string;
  translation?: string;
  explanation?: string;
  vocabulary?: VocabularyItem[];
  mediaType?: 'none' | 'link' | 'upload';
  mediaUrl?: string;
  mediaKind?: 'video' | 'audio';
  promptTask?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  contentId: string;
  moduleId: ModuleId;
  contentTitle: string;
  answerText: string;
  designerFeedback?: string;
  score?: number;
  status: 'pending' | 'reviewed';
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  arabicPrompt?: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
  points: number;
}

export type Predikat =
  | 'Mumtāz'
  | 'Jayyid Jiddan'
  | 'Jayyid'
  | 'Maqbūl'
  | 'Perlu Penguatan';

export interface ExamAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  predikat: Predikat;
  answers: number[];
  createdAt: string;
}

export interface Certificate {
  id: string;
  attemptId: string;
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  predikat: Predikat;
  arabicPredikat: string;
  certificateNumber: string;
  note?: string;
  issuedBy: string;
  issuedAt: string;
  acknowledgedAt?: string;
}

export interface Message {
  id: string;
  threadUserId: string;
  threadUserName: string;
  threadUserEmail: string;
  senderId: string;
  senderRole: Role;
  senderName: string;
  text: string;
  createdAt: string;
  readByDesigner: boolean;
  readByStudent: boolean;
}

export interface StudentDirectoryEntry {
  user: User;
  completedCount: number;
  totalContents: number;
  latestAttempt?: ExamAttempt;
  certificate?: Certificate;
}

export interface DesignerInfo {
  name: string;
  birthPlaceDate: string;
  region: string;
  university: string;
  nim: string;
  phone: string;
  email: string;
  roleTitle: string;
  vision: string;
}
