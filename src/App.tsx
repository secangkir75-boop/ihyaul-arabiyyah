import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ClipboardCheck,
  Edit3,
  Film,
  Headphones,
  Home,
  Languages,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareQuote,
  PenTool,
  PlusCircle,
  SearchCheck,
  Sparkles,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { api, setAuthToken } from './api';
import { AuthScreen } from './components/AuthScreen';
import { CommunicationView } from './components/CommunicationView';
import { DesignerContentManager } from './components/DesignerContentManager';
import { EmblemLogo } from './components/EmblemLogo';
import { ExamAndCertificateView } from './components/ExamAndCertificateView';
import { ModuleWorkspace } from './components/ModuleWorkspace';
import { ProfileAndDirectoryView } from './components/ProfileAndDirectoryView';
import { MODULES } from './constants';
import type {
  Certificate,
  ContentItem,
  DesignerInfo,
  ExamAttempt,
  ExamQuestion,
  Message,
  ModuleId,
  StudentDirectoryEntry,
  Submission,
  User,
} from './types';

type ActiveRoute =
  | 'home'
  | 'designer-dashboard'
  | 'designer-content'
  | 'designer-exam'
  | 'designer-results'
  | 'designer-students'
  | 'student-exam'
  | 'communication'
  | 'profile'
  | 'designer-bio'
  | ModuleId;

const MODULE_ICONS: Record<ModuleId, typeof BookOpen> = {
  materi: BookOpen,
  video: Film,
  cerita: Sparkles,
  menulis: PenTool,
  mendengar: Headphones,
  menganalisis: SearchCheck,
  menerjemah: Languages,
  ungkapan: MessageSquareQuote,
  pola: Layers,
};

const DEFAULT_DESIGNER_INFO: DesignerInfo = {
  name: 'Ilman Alfarizi',
  birthPlaceDate: 'Tentena, 06 Oktober 2005',
  region: 'Sulawesi Tengah',
  university: 'UIN Mataram',
  nim: '240102065',
  phone: '082283514946',
  email: 'secangkir75@gmail.com',
  roleTitle: 'Perancang & Pengembang Aplikasi Iḥyā’ul ‘Arabiyyah',
  vision:
    'Menghidupkan kembali kecintaan dan ketekunan belajar bahasa Arab bagi pelajar melalui materi terstruktur, latihan aktif, dan bimbingan langsung.',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<ActiveRoute>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [designerInfo, setDesignerInfo] = useState<DesignerInfo>(DEFAULT_DESIGNER_INFO);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([]);
  const [chatTargetStudentId, setChatTargetStudentId] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  const loadWorkspaceData = useCallback(async (loggedUser: User) => {
    setLoadingWorkspace(true);
    try {
      const [
        designerRes,
        contentsRes,
        progressRes,
        submissionsRes,
        questionsRes,
        attemptsRes,
        certsRes,
        messagesRes,
      ] = await Promise.all([
        api.getDesignerInfo(),
        api.getContents(),
        api.getProgress(),
        api.getSubmissions(),
        api.getExamQuestions(),
        api.getExamAttempts(),
        api.getCertificates(),
        api.getMessages(),
      ]);
      setDesignerInfo(designerRes.designer);
      setContents(contentsRes.contents);
      setCompletedIds(progressRes.completedContentIds);
      setSubmissions(submissionsRes.submissions);
      setExamQuestions(questionsRes.questions);
      setExamAttempts(attemptsRes.attempts);
      setCertificates(certsRes.certificates);
      setMessages(messagesRes.messages);

      if (loggedUser.role === 'designer') {
        const stuRes = await api.getStudents();
        setStudents(stuRes.students);
      }
    } finally {
      setLoadingWorkspace(false);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!user) return;
    const res = await api.getMessages();
    setMessages(res.messages);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWorkspaceData(user);
    }
  }, [user, loadWorkspaceData]);

  function handleAuthSuccess(loggedUser: User) {
    setUser(loggedUser);
    setRoute(loggedUser.role === 'designer' ? 'designer-dashboard' : 'home');
  }

  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setRoute('home');
    setMobileMenuOpen(false);
  }

  async function handleToggleComplete(contentId: string) {
    const res = await api.toggleProgress(contentId);
    setCompletedIds(res.completedContentIds);
  }

  const totalContents = contents.length;
  const completedCount = useMemo(
    () => completedIds.filter((id) => contents.some((c) => c.id === id)).length,
    [completedIds, contents]
  );
  const overallPercent =
    totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

  const unreadMessagesCount = useMemo(() => {
    if (!user) return 0;
    if (user.role === 'designer') {
      return messages.filter((m) => m.senderRole === 'student' && !m.readByDesigner).length;
    }
    return messages.filter((m) => m.senderRole === 'designer' && !m.readByStudent).length;
  }, [user, messages]);

  const unacknowledgedCerts = useMemo(
    () => certificates.filter((c) => !c.acknowledgedAt),
    [certificates]
  );

  if (!user) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  const isModuleRoute = MODULES.some((m) => m.id === route);

  function navigateTo(next: ActiveRoute) {
    setRoute(next);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#072F24] text-[#E6ECE8]">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#C99A2E]/25 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <EmblemLogo sizeClass="w-10 h-10" />
          <div className="min-w-0">
            <p className="font-arabic text-base font-bold text-[#E2BE5B] leading-none">
              إحياء العربية
            </p>
            <p className="font-display text-sm font-bold text-[#F9F5EB] truncate mt-1">
              Iḥyā’ul ‘Arabiyyah
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Tutup menu"
          className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-[#E6ECE8] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {user.role === 'designer' && (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-[#E2BE5B]/80">
              PERANCANG
            </p>
            {[
              { id: 'designer-dashboard' as const, label: 'Dasbor Perancang', icon: LayoutDashboard },
              { id: 'designer-content' as const, label: 'Kelola Konten', icon: Edit3 },
              { id: 'designer-exam' as const, label: 'Kelola Ujian', icon: ClipboardCheck },
              { id: 'designer-results' as const, label: 'Hasil & Sertifikat', icon: Award },
              { id: 'designer-students' as const, label: 'Data Pelajar', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                      : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#E2BE5B]' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-[#E2BE5B]/80">
            BELAJAR
          </p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
              route === 'home'
                ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
            }`}
          >
            <Home className={`w-4 h-4 shrink-0 ${route === 'home' ? 'text-[#E2BE5B]' : ''}`} />
            <span>Beranda</span>
          </button>

          {MODULES.map((mod) => {
            const Icon = MODULE_ICONS[mod.id];
            const active = route === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => navigateTo(mod.id)}
                className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                    : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#E2BE5B]' : ''}`} />
                <span className="truncate">{mod.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-[#E2BE5B]/80">
            EVALUASI & AKUN
          </p>
          {user.role === 'student' && (
            <button
              type="button"
              onClick={() => navigateTo('student-exam')}
              className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                route === 'student-exam'
                  ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                  : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
              }`}
            >
              <span className="flex items-center gap-3 truncate">
                <Award
                  className={`w-4 h-4 shrink-0 ${
                    route === 'student-exam' ? 'text-[#E2BE5B]' : ''
                  }`}
                />
                <span>Ujian & Sertifikat</span>
              </span>
              {unacknowledgedCerts.length > 0 && (
                <span className="text-xs font-bold text-[#E2BE5B]">Baru</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigateTo('communication')}
            className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              route === 'communication'
                ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
            }`}
          >
            <span className="flex items-center gap-3 truncate">
              <MessageCircle
                className={`w-4 h-4 shrink-0 ${
                  route === 'communication' ? 'text-[#E2BE5B]' : ''
                }`}
              />
              <span>Komunikasi</span>
            </span>
            {unreadMessagesCount > 0 && (
              <span className="text-xs font-bold text-[#E2BE5B] tabular-nums">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
              route === 'profile'
                ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
            }`}
          >
            <UserIcon className={`w-4 h-4 shrink-0 ${route === 'profile' ? 'text-[#E2BE5B]' : ''}`} />
            <span>Profil Saya</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('designer-bio')}
            className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
              route === 'designer-bio'
                ? 'bg-[#0F5744] text-[#F9F5EB] font-semibold'
                : 'text-[#C7D6CF] hover:bg-white/5 hover:text-[#F9F5EB]'
            }`}
          >
            <BookOpen
              className={`w-4 h-4 shrink-0 ${route === 'designer-bio' ? 'text-[#E2BE5B]' : ''}`}
            />
            <span>Data Perancang</span>
          </button>
        </div>
      </nav>

      {/* Sign out footer */}
      <div className="p-3 border-t border-[#C99A2E]/25">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full min-h-[42px] px-3 py-2 rounded-xl text-sm text-[#E6ECE8] hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#E2BE5B]" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F5EB] text-[#142921] flex">
      {/* Desktop Left Sidebar */}
      <aside className="no-print hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 z-30 border-r border-[#C99A2E]/25">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        {/* Top Bar + Ornamental Gold Divider (matching Screenshot 3) */}
        <header className="no-print sticky top-0 z-20">
          <div className="h-14 px-4 sm:px-8 bg-[#072F24] text-[#F9F5EB] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka navigasi"
                className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <Menu className="w-5 h-5 text-[#E2BE5B]" />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-[#E2BE5B] whitespace-nowrap">
                {user.role === 'designer' ? 'Akun Perancang' : 'Akun Pelajar'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm min-w-0">
              <button
                type="button"
                onClick={() => navigateTo('profile')}
                className="font-medium text-[#F9F5EB] hover:text-[#E2BE5B] truncate max-w-[180px] sm:max-w-xs cursor-pointer"
              >
                {user.name}
              </button>
            </div>
          </div>
          <div className="gold-ornament-divider" aria-hidden="true" />
        </header>

        {/* Scrollable Content Canvas */}
        <main className="flex-1 islamic-pattern-ivory px-4 sm:px-8 lg:px-10 py-6 sm:py-8 pb-24 lg:pb-12">
          <div className="max-w-6xl mx-auto">
            {loadingWorkspace && contents.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#52675E]">
                Memuat ruang belajar Iḥyā’ul ‘Arabiyyah...
              </div>
            ) : route === 'home' ? (
              <div className="space-y-7">
                {/* Greeting Header matching Screenshot 3 */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] text-balance">
                      Selamat datang, {user.name}
                    </h1>
                    <p className="text-sm text-[#52675E] mt-1">
                      Pilih modul di bawah untuk melanjutkan latihan bahasa Arab hari ini.
                    </p>
                  </div>
                  <p className="font-arabic text-2xl sm:text-3xl font-bold text-[#B68924] shrink-0">
                    أَهْلاً وَسَهْلاً
                  </p>
                </div>

                {/* Student Certificate Prompt on Home */}
                {user.role === 'student' && unacknowledgedCerts.length > 0 && (
                  <div className="p-5 rounded-2xl bg-[#FFFDF8] border-2 border-[#C99A2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[#B68924]">
                        Sertifikat Baru Tersedia
                      </p>
                      <p className="font-display text-lg font-bold text-[#142921]">
                        Perancang telah mengirimkan sertifikat predikat {unacknowledgedCerts[0].predikat} untuk Anda
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('student-exam')}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B4334] text-[#F9F5EB] text-xs font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Buka & Terima Sertifikat
                    </button>
                  </div>
                )}

                {/* KEMAJUAN BELAJARKU Banner matching Screenshot 3 */}
                <section className="islamic-pattern-emerald rounded-2xl p-6 sm:p-7 text-[#F9F5EB] border border-[#C99A2E]/35 shadow-sm">
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider text-[#E2BE5B]">
                        KEMAJUAN BELAJARKU
                      </p>
                      <p className="font-display text-lg sm:text-xl font-bold mt-1 tabular-nums">
                        {completedCount} dari {totalContents} konten selesai
                      </p>
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-bold text-[#E2BE5B] tabular-nums">
                      {overallPercent}%
                    </p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E2BE5B] transition-all duration-300"
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                </section>

                {/* 9 Learning Modules Grid matching Screenshot 3 */}
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {MODULES.map((mod) => {
                    const Icon = MODULE_ICONS[mod.id];
                    const items = contents.filter((c) => c.moduleId === mod.id);
                    const done = items.filter((c) => completedIds.includes(c.id)).length;
                    const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => navigateTo(mod.id)}
                        className="text-left bg-[#FFFDF8] hover:bg-white border border-[#DFD5BC] hover:border-[#C99A2E] rounded-2xl p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0B4334] text-[#E2BE5B] flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-arabic text-lg font-bold text-[#0B4334]/75">
                              {mod.arabicLabel}
                            </span>
                          </div>
                          <div>
                            <h2 className="font-display text-lg font-bold text-[#142921]">
                              {mod.label}
                            </h2>
                            <p className="text-xs text-[#52675E] mt-1 leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs text-[#52675E] tabular-nums">
                            <span>
                              {done}/{items.length} selesai
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#EFE7D3] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#C99A2E]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </section>
              </div>
            ) : route === 'designer-dashboard' && user.role === 'designer' ? (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D9CEB4]">
                  <div>
                    <p className="text-xs font-semibold text-[#B68924]">
                      Panel Pengelola Utama ({user.email})
                    </p>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
                      Dasbor Perancang — {user.name}
                    </h1>
                    <p className="text-sm text-[#52675E] mt-1">
                      Kelola seluruh isi 9 modul pembelajaran, pantau pelajar, koreksi latihan, dan terbitkan sertifikat kelulusan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('designer-content')}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-sm font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-[#E2BE5B]" />
                    <span>Tambah Konten / Video</span>
                  </button>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Total Konten Modul',
                      value: contents.length,
                      sub: 'Tersebar di 9 modul',
                    },
                    {
                      label: 'Pelajar Terdaftar',
                      value: students.length,
                      sub: 'Aktif belajar',
                    },
                    {
                      label: 'Latihan Belum Dikoreksi',
                      value: submissions.filter((s) => s.status === 'pending').length,
                      sub: 'Menulis & Analisis',
                    },
                    {
                      label: 'Sertifikat Diterbitkan',
                      value: certificates.length,
                      sub: `${examAttempts.length} riwayat ujian`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-5"
                    >
                      <p className="text-xs font-medium text-[#52675E]">{stat.label}</p>
                      <p className="font-display text-3xl font-bold text-[#0B4334] mt-2 tabular-nums">
                        {stat.value}
                      </p>
                      <p className="text-xs text-[#52675E] mt-1">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => navigateTo('designer-content')}
                    className="text-left p-6 rounded-2xl bg-[#FFFDF8] border border-[#D9CEB4] hover:border-[#C99A2E] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-6 h-6 text-[#0B4334] mb-3" />
                    <h2 className="font-display text-lg font-bold text-[#142921]">
                      Unggah Video & Materi
                    </h2>
                    <p className="text-xs text-[#52675E] mt-1">
                      Masukkan video lewat tautan link atau unggah langsung file video/musik dari perangkat Android.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('designer-results')}
                    className="text-left p-6 rounded-2xl bg-[#FFFDF8] border border-[#D9CEB4] hover:border-[#C99A2E] transition-colors cursor-pointer"
                  >
                    <Award className="w-6 h-6 text-[#0B4334] mb-3" />
                    <h2 className="font-display text-lg font-bold text-[#142921]">
                      Nilai Ujian & Sertifikat
                    </h2>
                    <p className="text-xs text-[#52675E] mt-1">
                      Tinjau nilai ujian pelajar dan kirim sertifikat predikat Maqbūl hingga Mumtāz.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('communication')}
                    className="text-left p-6 rounded-2xl bg-[#FFFDF8] border border-[#D9CEB4] hover:border-[#C99A2E] transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-6 h-6 text-[#0B4334] mb-3" />
                    <h2 className="font-display text-lg font-bold text-[#142921]">
                      Pesan Masuk Pelajar ({unreadMessagesCount})
                    </h2>
                    <p className="text-xs text-[#52675E] mt-1">
                      Berkomunikasi dan membimbing pelajar secara langsung dari aplikasi.
                    </p>
                  </button>
                </div>
              </div>
            ) : route === 'designer-content' && user.role === 'designer' ? (
              <DesignerContentManager
                contents={contents}
                onContentCreated={(item) => setContents((prev) => [item, ...prev])}
                onContentUpdated={(item) =>
                  setContents((prev) => prev.map((c) => (c.id === item.id ? item : c)))
                }
                onContentDeleted={(id) =>
                  setContents((prev) => prev.filter((c) => c.id !== id))
                }
              />
            ) : route === 'designer-exam' && user.role === 'designer' ? (
              <ExamAndCertificateView
                mode="designer-exam"
                user={user}
                questions={examQuestions}
                attempts={examAttempts}
                certificates={certificates}
                onQuestionAdded={(q) => setExamQuestions((prev) => [...prev, q])}
                onQuestionDeleted={(id) =>
                  setExamQuestions((prev) => prev.filter((q) => q.id !== id))
                }
                onExamSubmitted={(att) => setExamAttempts((prev) => [att, ...prev])}
                onCertificateIssued={(cert) =>
                  setCertificates((prev) => [cert, ...prev.filter((c) => c.id !== cert.id)])
                }
                onCertificateAcknowledged={(cert) =>
                  setCertificates((prev) => prev.map((c) => (c.id === cert.id ? cert : c)))
                }
              />
            ) : route === 'designer-results' && user.role === 'designer' ? (
              <ExamAndCertificateView
                mode="designer-results"
                user={user}
                questions={examQuestions}
                attempts={examAttempts}
                certificates={certificates}
                onQuestionAdded={(q) => setExamQuestions((prev) => [...prev, q])}
                onQuestionDeleted={(id) =>
                  setExamQuestions((prev) => prev.filter((q) => q.id !== id))
                }
                onExamSubmitted={(att) => setExamAttempts((prev) => [att, ...prev])}
                onCertificateIssued={(cert) =>
                  setCertificates((prev) => [cert, ...prev.filter((c) => c.id !== cert.id)])
                }
                onCertificateAcknowledged={(cert) =>
                  setCertificates((prev) => prev.map((c) => (c.id === cert.id ? cert : c)))
                }
              />
            ) : route === 'student-exam' ? (
              <ExamAndCertificateView
                mode="student-exam"
                user={user}
                questions={examQuestions}
                attempts={examAttempts}
                certificates={certificates}
                onQuestionAdded={(q) => setExamQuestions((prev) => [...prev, q])}
                onQuestionDeleted={(id) =>
                  setExamQuestions((prev) => prev.filter((q) => q.id !== id))
                }
                onExamSubmitted={(att) => setExamAttempts((prev) => [att, ...prev])}
                onCertificateIssued={(cert) =>
                  setCertificates((prev) => [cert, ...prev.filter((c) => c.id !== cert.id)])
                }
                onCertificateAcknowledged={(cert) =>
                  setCertificates((prev) => prev.map((c) => (c.id === cert.id ? cert : c)))
                }
              />
            ) : route === 'communication' ? (
              <CommunicationView
                user={user}
                messages={messages}
                students={students}
                initialThreadUserId={chatTargetStudentId}
                onMessageSent={(msg) => setMessages((prev) => [...prev, msg])}
                onRefreshMessages={refreshMessages}
              />
            ) : route === 'designer-students' && user.role === 'designer' ? (
              <ProfileAndDirectoryView
                mode="students"
                user={user}
                designerInfo={designerInfo}
                students={students}
                onProfileUpdated={setUser}
                onOpenChat={(stuId) => {
                  if (stuId) setChatTargetStudentId(stuId);
                  navigateTo('communication');
                }}
              />
            ) : route === 'designer-bio' ? (
              <ProfileAndDirectoryView
                mode="designer-bio"
                user={user}
                designerInfo={designerInfo}
                students={students}
                onProfileUpdated={setUser}
                onOpenChat={() => navigateTo('communication')}
              />
            ) : route === 'profile' ? (
              <ProfileAndDirectoryView
                mode="profile"
                user={user}
                designerInfo={designerInfo}
                students={students}
                onProfileUpdated={setUser}
                onOpenChat={() => navigateTo('communication')}
              />
            ) : isModuleRoute ? (
              <ModuleWorkspace
                moduleId={route as ModuleId}
                user={user}
                contents={contents}
                completedIds={completedIds}
                submissions={submissions}
                onToggleComplete={handleToggleComplete}
                onSubmissionCreated={(sub) => setSubmissions((prev) => [sub, ...prev])}
                onSubmissionReviewed={(sub) =>
                  setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? sub : s)))
                }
              />
            ) : null}
          </div>
        </main>

        {/* Compact Mobile Bottom Navigation Bar (Android thumb-zone friendly, <= 15% height) */}
        <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#072F24]/95 backdrop-blur-md border-t border-[#C99A2E]/35 grid grid-cols-4 items-center text-[#C7D6CF]">
          <button
            type="button"
            onClick={() => navigateTo(user.role === 'designer' ? 'designer-dashboard' : 'home')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
              route === 'home' || route === 'designer-dashboard' ? 'text-[#E2BE5B]' : ''
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(user.role === 'designer' ? 'designer-content' : 'materi')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
              route === 'designer-content' || isModuleRoute ? 'text-[#E2BE5B]' : ''
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>{user.role === 'designer' ? 'Konten' : 'Belajar'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(user.role === 'designer' ? 'designer-results' : 'student-exam')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
              route === 'student-exam' || route === 'designer-results' ? 'text-[#E2BE5B]' : ''
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Sertifikat</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('communication')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
              route === 'communication' ? 'text-[#E2BE5B]' : ''
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Pesan</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
