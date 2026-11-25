import type {
  Certificate,
  ContentItem,
  DesignerInfo,
  ExamAttempt,
  ExamQuestion,
  Message,
  StudentDirectoryEntry,
  Submission,
  User,
} from './types';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'Terjadi kesalahan pada server.');
  }
  return data as T;
}

export const api = {
  getDesignerInfo: () => request<{ designer: DesignerInfo }>('/api/designer-info'),

  checkEmail: (email: string) =>
    request<{ role: 'designer' | 'student'; exists: boolean; needsSetup: boolean; studentName?: string }>(
      '/api/auth/check-email',
      { method: 'POST', body: JSON.stringify({ email }) }
    ),

  claimDesignerPassword: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/designer-claim', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    name: string;
    password: string;
    region?: string;
    institution?: string;
    phone?: string;
  }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: Partial<User>) =>
    request<{ user: User }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getStudents: () => request<{ students: StudentDirectoryEntry[] }>('/api/students'),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('media', file);
    return request<{ url: string; originalName: string; mediaKind: 'video' | 'audio'; size: number }>(
      '/api/upload',
      { method: 'POST', body: formData }
    );
  },

  getContents: () => request<{ contents: ContentItem[] }>('/api/contents'),

  createContent: (payload: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<{ content: ContentItem }>('/api/contents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateContent: (id: string, payload: Partial<ContentItem>) =>
    request<{ content: ContentItem }>(`/api/contents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteContent: (id: string) =>
    request<{ ok: boolean }>(`/api/contents/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getProgress: () => request<{ completedContentIds: string[] }>('/api/progress'),

  toggleProgress: (contentId: string) =>
    request<{ completedContentIds: string[] }>('/api/progress/toggle', {
      method: 'POST',
      body: JSON.stringify({ contentId }),
    }),

  getSubmissions: () => request<{ submissions: Submission[] }>('/api/submissions'),

  createSubmission: (contentId: string, answerText: string) =>
    request<{ submission: Submission }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify({ contentId, answerText }),
    }),

  reviewSubmission: (id: string, feedback: string, score?: number) =>
    request<{ submission: Submission }>(`/api/submissions/${encodeURIComponent(id)}/review`, {
      method: 'PUT',
      body: JSON.stringify({ feedback, score }),
    }),

  getExamQuestions: () => request<{ questions: ExamQuestion[] }>('/api/exam/questions'),

  createExamQuestion: (payload: {
    question: string;
    arabicPrompt?: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }) =>
    request<{ question: ExamQuestion }>('/api/exam/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteExamQuestion: (id: string) =>
    request<{ ok: boolean }>(`/api/exam/questions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  submitExam: (answers: number[]) =>
    request<{
      attempt: ExamAttempt;
      details: Array<{
        questionId: string;
        correctIndex: number;
        chosenIndex: number;
        isCorrect: boolean;
        explanation?: string;
      }>;
    }>('/api/exam/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getExamAttempts: () => request<{ attempts: ExamAttempt[] }>('/api/exam/attempts'),

  getCertificates: () => request<{ certificates: Certificate[] }>('/api/certificates'),

  issueCertificate: (attemptId: string, note?: string) =>
    request<{ certificate: Certificate }>('/api/certificates/issue', {
      method: 'POST',
      body: JSON.stringify({ attemptId, note }),
    }),

  acknowledgeCertificate: (certId: string) =>
    request<{ certificate: Certificate }>(`/api/certificates/${encodeURIComponent(certId)}/acknowledge`, {
      method: 'POST',
    }),

  getMessages: () => request<{ messages: Message[] }>('/api/messages'),

  sendMessage: (text: string, threadUserId?: string) =>
    request<{ message: Message }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ text, threadUserId }),
    }),

  markMessagesRead: (threadUserId?: string) =>
    request<{ ok: boolean }>('/api/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify({ threadUserId }),
    }),
};
