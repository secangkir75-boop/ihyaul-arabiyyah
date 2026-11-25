import 'dotenv/config';
import crypto from 'crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, DESIGNER_EMAIL, DESIGNER_PROFILE, verifyPassword } from './server/store';
import type { ModuleId, User } from './src/types';

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const VALID_MODULES: ReadonlySet<ModuleId> = new Set([
  'materi',
  'video',
  'cerita',
  'menulis',
  'mendengar',
  'menganalisis',
  'menerjemah',
  'ungkapan',
  'pola',
]);

const ALLOWED_MEDIA_EXTS = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.mkv',
  '.3gp',
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
]);

interface TokenPayload {
  uid: string;
  role: 'designer' | 'student';
  email: string;
  exp: number;
}

function signToken(user: User): string {
  const payload: TokenPayload = {
    uid: user.id,
    role: user.role,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf-8');
  const expBuf = Buffer.from(expectedSig, 'utf-8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TokenPayload;
    if (!parsed || typeof parsed.uid !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  currentUser?: User;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan masuk kembali.' });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sesi berakhir atau tidak valid. Silakan masuk kembali.' });
    return;
  }
  const user = db.findUserById(payload.uid);
  if (!user) {
    res.status(401).json({ error: 'Akun pengguna tidak ditemukan.' });
    return;
  }
  req.currentUser = user;
  next();
}

function requireDesigner(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (
      !req.currentUser ||
      req.currentUser.role !== 'designer' ||
      req.currentUser.email.toLowerCase() !== DESIGNER_EMAIL
    ) {
      res.status(403).json({ error: 'Akses ditolak. Fitur ini khusus untuk Perancang Aplikasi.' });
      return;
    }
    next();
  });
}

function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/uploads/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_MEDIA_EXTS.has(ext) ? ext : '.mp4';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
    if (mimeOk || ALLOWED_MEDIA_EXTS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file harus berupa video (MP4, WebM, MOV) atau audio (MP3, WAV, M4A, OGG).'));
    }
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

  // Public designer metadata
  app.get('/api/designer-info', (_req, res) => {
    res.json({ designer: DESIGNER_PROFILE });
  });

  // Auth routes
  app.post('/api/auth/check-email', (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!rawEmail || !isValidEmailFormat(rawEmail)) {
      res.status(400).json({ error: 'Masukkan alamat email yang valid.' });
      return;
    }
    if (rawEmail === DESIGNER_EMAIL) {
      res.json({
        role: 'designer',
        exists: true,
        needsSetup: db.getDesignerNeedsSetup(),
      });
      return;
    }
    const existing = db.findUserByEmail(rawEmail);
    res.json({
      role: 'student',
      exists: Boolean(existing),
      needsSetup: false,
      studentName: existing?.name,
    });
  });

  app.post('/api/auth/designer-claim', (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (rawEmail !== DESIGNER_EMAIL) {
      res.status(403).json({ error: 'Hanya email perancang resmi yang dapat mengklaim akses perancang.' });
      return;
    }
    if (password.trim().length < 4 || password.length > 128) {
      res.status(400).json({ error: 'Kata sandi perancang minimal 4 karakter.' });
      return;
    }
    try {
      const user = db.claimDesignerPassword(password);
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mengatur sandi.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!rawEmail || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    if (rawEmail === DESIGNER_EMAIL) {
      if (db.getDesignerNeedsSetup()) {
        res.status(400).json({ error: 'Akun perancang belum diatur kata sandinya. Silakan atur sandi terlebih dahulu.' });
        return;
      }
      if (!db.verifyDesignerPassword(password)) {
        res.status(401).json({ error: 'Kata sandi perancang tidak sesuai.' });
        return;
      }
      const user = db.getDesignerUser();
      const token = signToken(user);
      res.json({ token, user });
      return;
    }

    const found = db.findUserByEmail(rawEmail);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Email atau kata sandi salah. Jika lupa sandi email pribadi, Anda dapat membuat akun email baru.' });
      return;
    }
    const { passwordHash: _ph, ...safeUser } = found;
    const token = signToken(safeUser);
    res.json({ token, user: safeUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const region = typeof req.body?.region === 'string' ? req.body.region : '';
    const institution = typeof req.body?.institution === 'string' ? req.body.institution : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';

    if (!isValidEmailFormat(email)) {
      res.status(400).json({ error: 'Format email tidak valid.' });
      return;
    }
    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ error: 'Nama lengkap harus 2 sampai 80 karakter.' });
      return;
    }
    if (password.length < 4 || password.length > 128) {
      res.status(400).json({ error: 'Kata sandi minimal 4 karakter.' });
      return;
    }

    try {
      const user = db.createStudent({ email, name, password, region, institution, phone });
      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal mendaftar.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    res.json({ user: req.currentUser });
  });

  // Profile
  app.put('/api/profile', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const { name, birthPlaceDate, region, institution, phone, bio } = req.body || {};
    const updated = db.updateUserProfile(user.id, {
      name: typeof name === 'string' ? name.slice(0, 80) : undefined,
      birthPlaceDate: typeof birthPlaceDate === 'string' ? birthPlaceDate.slice(0, 80) : undefined,
      region: typeof region === 'string' ? region.slice(0, 80) : undefined,
      institution: typeof institution === 'string' ? institution.slice(0, 120) : undefined,
      phone: typeof phone === 'string' ? phone.slice(0, 30) : undefined,
      bio: typeof bio === 'string' ? bio.slice(0, 400) : undefined,
    });
    res.json({ user: updated });
  });

  // Designer-only Student Directory
  app.get('/api/students', requireDesigner, (_req, res) => {
    res.json({ students: db.listStudents() });
  });

  // Media Upload (Designer only: Android / PC local video & audio upload)
  app.post('/api/upload', requireDesigner, (req, res) => {
    upload.single('media')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Gagal mengunggah file media.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Tidak ada file video atau audio yang dipilih.' });
        return;
      }
      const isAudio =
        req.file.mimetype.startsWith('audio/') ||
        ['.mp3', '.wav', '.m4a', '.ogg', '.aac'].includes(path.extname(req.file.filename).toLowerCase());
      res.json({
        url: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        mediaKind: isAudio ? 'audio' : 'video',
        size: req.file.size,
      });
    });
  });

  // Learning Contents
  app.get('/api/contents', requireAuth, (_req, res) => {
    res.json({ contents: db.getContents() });
  });

  app.post('/api/contents', requireDesigner, (req, res) => {
    const body = req.body || {};
    const moduleId = body.moduleId as ModuleId;
    if (!VALID_MODULES.has(moduleId)) {
      res.status(400).json({ error: 'Kategori modul tidak valid.' });
      return;
    }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
    if (!title || !summary) {
      res.status(400).json({ error: 'Judul dan ringkasan materi wajib diisi.' });
      return;
    }
    const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl.trim() : '';
    if (mediaUrl && !isSafeMediaUrl(mediaUrl)) {
      res.status(400).json({ error: 'URL media harus menggunakan http://, https://, atau hasil unggahan lokal.' });
      return;
    }

    const level = body.level === 'Menengah' || body.level === 'Lanjut' ? body.level : 'Dasar';
    const mediaType = body.mediaType === 'link' || body.mediaType === 'upload' ? body.mediaType : 'none';
    const mediaKind = body.mediaKind === 'audio' ? 'audio' : 'video';

    const vocabulary = Array.isArray(body.vocabulary)
      ? body.vocabulary
          .filter((v: unknown): v is { arabic: string; transliteration?: string; meaning: string } =>
            Boolean(v && typeof v === 'object' && typeof (v as { arabic?: unknown }).arabic === 'string')
          )
          .slice(0, 30)
      : [];

    const created = db.createContent({
      moduleId,
      title: title.slice(0, 160),
      arabicTitle: typeof body.arabicTitle === 'string' ? body.arabicTitle.trim().slice(0, 160) : '',
      level,
      summary: summary.slice(0, 400),
      arabicText: typeof body.arabicText === 'string' ? body.arabicText.trim().slice(0, 5000) : '',
      translation: typeof body.translation === 'string' ? body.translation.trim().slice(0, 5000) : '',
      explanation: typeof body.explanation === 'string' ? body.explanation.trim().slice(0, 5000) : '',
      promptTask: typeof body.promptTask === 'string' ? body.promptTask.trim().slice(0, 1500) : '',
      vocabulary,
      mediaType,
      mediaUrl,
      mediaKind,
    });
    res.status(201).json({ content: created });
  });

  app.put('/api/contents/:id', requireDesigner, (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const mediaUrl = typeof body.mediaUrl === 'string' ? body.mediaUrl.trim() : undefined;
    if (mediaUrl && !isSafeMediaUrl(mediaUrl)) {
      res.status(400).json({ error: 'URL media tidak valid.' });
      return;
    }
    try {
      const updated = db.updateContent(id, {
        moduleId: VALID_MODULES.has(body.moduleId) ? body.moduleId : undefined,
        title: typeof body.title === 'string' ? body.title.trim().slice(0, 160) : undefined,
        arabicTitle: typeof body.arabicTitle === 'string' ? body.arabicTitle.trim().slice(0, 160) : undefined,
        level: body.level === 'Dasar' || body.level === 'Menengah' || body.level === 'Lanjut' ? body.level : undefined,
        summary: typeof body.summary === 'string' ? body.summary.trim().slice(0, 400) : undefined,
        arabicText: typeof body.arabicText === 'string' ? body.arabicText.trim().slice(0, 5000) : undefined,
        translation: typeof body.translation === 'string' ? body.translation.trim().slice(0, 5000) : undefined,
        explanation: typeof body.explanation === 'string' ? body.explanation.trim().slice(0, 5000) : undefined,
        promptTask: typeof body.promptTask === 'string' ? body.promptTask.trim().slice(0, 1500) : undefined,
        mediaType: body.mediaType === 'none' || body.mediaType === 'link' || body.mediaType === 'upload' ? body.mediaType : undefined,
        mediaUrl,
        mediaKind: body.mediaKind === 'audio' || body.mediaKind === 'video' ? body.mediaKind : undefined,
        vocabulary: Array.isArray(body.vocabulary) ? body.vocabulary.slice(0, 30) : undefined,
      });
      res.json({ content: updated });
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Konten tidak ditemukan.' });
    }
  });

  app.delete('/api/contents/:id', requireDesigner, (req, res) => {
    db.deleteContent(req.params.id);
    res.json({ ok: true });
  });

  // Progress
  app.get('/api/progress', requireAuth, (req: AuthedRequest, res) => {
    res.json({ completedContentIds: db.getUserProgress(req.currentUser!.id) });
  });

  app.post('/api/progress/toggle', requireAuth, (req: AuthedRequest, res) => {
    const contentId = typeof req.body?.contentId === 'string' ? req.body.contentId.trim() : '';
    if (!contentId) {
      res.status(400).json({ error: 'ID konten diperlukan.' });
      return;
    }
    const completedContentIds = db.toggleUserProgress(req.currentUser!.id, contentId);
    res.json({ completedContentIds });
  });

  // Practice Submissions (Menulis, Menganalisis, Menerjemah)
  app.get('/api/submissions', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const submissions = user.role === 'designer' ? db.getSubmissions() : db.getSubmissions(user.id);
    res.json({ submissions });
  });

  app.post('/api/submissions', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const contentId = typeof req.body?.contentId === 'string' ? req.body.contentId : '';
    const answerText = typeof req.body?.answerText === 'string' ? req.body.answerText.trim() : '';
    if (!contentId || !answerText) {
      res.status(400).json({ error: 'Jawaban latihan wajib diisi.' });
      return;
    }
    const content = db.getContents().find((c) => c.id === contentId);
    if (!content) {
      res.status(404).json({ error: 'Materi latihan tidak ditemukan.' });
      return;
    }
    const submission = db.createSubmission({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      contentId: content.id,
      moduleId: content.moduleId,
      contentTitle: content.title,
      answerText: answerText.slice(0, 4000),
    });
    res.status(201).json({ submission });
  });

  app.put('/api/submissions/:id/review', requireDesigner, (req, res) => {
    const feedback = typeof req.body?.feedback === 'string' ? req.body.feedback.trim() : '';
    const score = typeof req.body?.score === 'number' ? Math.min(100, Math.max(0, req.body.score)) : undefined;
    if (!feedback) {
      res.status(400).json({ error: 'Catatan koreksi wajib diisi.' });
      return;
    }
    try {
      const submission = db.reviewSubmission(req.params.id, feedback.slice(0, 2000), score);
      res.json({ submission });
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Kiriman tidak ditemukan.' });
    }
  });

  // Exam & Certificates
  app.get('/api/exam/questions', requireAuth, (req: AuthedRequest, res) => {
    const includeAnswers = req.currentUser!.role === 'designer';
    res.json({ questions: db.getExamQuestions(includeAnswers) });
  });

  app.post('/api/exam/questions', requireDesigner, (req, res) => {
    const body = req.body || {};
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const arabicPrompt = typeof body.arabicPrompt === 'string' ? body.arabicPrompt.trim() : '';
    const options = Array.isArray(body.options)
      ? body.options.filter((o: unknown): o is string => typeof o === 'string' && o.trim().length > 0).map((o: string) => o.trim())
      : [];
    const correctIndex = typeof body.correctIndex === 'number' ? body.correctIndex : 0;
    const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : '';

    if (!question || options.length < 2) {
      res.status(400).json({ error: 'Pertanyaan dan minimal 2 pilihan jawaban wajib diisi.' });
      return;
    }
    const created = db.createExamQuestion({
      question: question.slice(0, 500),
      arabicPrompt: arabicPrompt.slice(0, 500),
      options: options.slice(0, 5),
      correctIndex: Math.max(0, Math.min(options.length - 1, correctIndex)),
      explanation: explanation.slice(0, 500),
      points: 10,
    });
    res.status(201).json({ question: created });
  });

  app.delete('/api/exam/questions/:id', requireDesigner, (req, res) => {
    db.deleteExamQuestion(req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/exam/submit', requireAuth, (req: AuthedRequest, res) => {
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    try {
      const result = db.gradeAndSaveExam(req.currentUser!, answers);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal memproses ujian.' });
    }
  });

  app.get('/api/exam/attempts', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const attempts = user.role === 'designer' ? db.getExamAttempts() : db.getExamAttempts(user.id);
    res.json({ attempts });
  });

  app.get('/api/certificates', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const certificates = user.role === 'designer' ? db.getCertificates() : db.getCertificates(user.id);
    res.json({ certificates });
  });

  app.post('/api/certificates/issue', requireDesigner, (req, res) => {
    const attemptId = typeof req.body?.attemptId === 'string' ? req.body.attemptId : '';
    const note = typeof req.body?.note === 'string' ? req.body.note : undefined;
    if (!attemptId) {
      res.status(400).json({ error: 'ID hasil ujian diperlukan.' });
      return;
    }
    try {
      const certificate = db.issueCertificate(attemptId, note);
      res.status(201).json({ certificate });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Gagal menerbitkan sertifikat.' });
    }
  });

  app.post('/api/certificates/:id/acknowledge', requireAuth, (req: AuthedRequest, res) => {
    try {
      const certificate = db.acknowledgeCertificate(req.params.id, req.currentUser!.id);
      res.json({ certificate });
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Sertifikat tidak ditemukan.' });
    }
  });

  // Communication / Chat between Student and Designer
  app.get('/api/messages', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const messages = user.role === 'designer' ? db.getMessages() : db.getMessages(user.id);
    res.json({ messages });
  });

  app.post('/api/messages', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
      return;
    }

    let threadUserId = user.id;
    let threadUserName = user.name;
    let threadUserEmail = user.email;

    if (user.role === 'designer') {
      const targetUserId = typeof req.body?.threadUserId === 'string' ? req.body.threadUserId : '';
      const targetUser = db.findUserById(targetUserId);
      if (!targetUser) {
        res.status(404).json({ error: 'Pelajar tujuan tidak ditemukan.' });
        return;
      }
      threadUserId = targetUser.id;
      threadUserName = targetUser.name;
      threadUserEmail = targetUser.email;
    }

    const message = db.addMessage({
      threadUserId,
      threadUserName,
      threadUserEmail,
      senderId: user.id,
      senderRole: user.role,
      senderName: user.name,
      text: text.slice(0, 2000),
      readByDesigner: user.role === 'designer',
      readByStudent: user.role === 'student',
    });
    res.status(201).json({ message });
  });

  app.post('/api/messages/mark-read', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const threadUserId =
      user.role === 'designer' && typeof req.body?.threadUserId === 'string'
        ? req.body.threadUserId
        : user.id;
    db.markThreadRead(threadUserId, user.role);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Iḥyā’ul ‘Arabiyyah server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
