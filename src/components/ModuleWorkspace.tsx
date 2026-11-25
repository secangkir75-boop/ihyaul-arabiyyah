import { useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { api } from '../api';
import { MODULES } from '../constants';
import type { ContentItem, ModuleId, Submission, User } from '../types';

interface ModuleWorkspaceProps {
  moduleId: ModuleId;
  user: User;
  contents: ContentItem[];
  completedIds: string[];
  submissions: Submission[];
  onToggleComplete: (contentId: string) => Promise<void>;
  onSubmissionCreated: (submission: Submission) => void;
  onSubmissionReviewed: (submission: Submission) => void;
  onOpenChatWithStudent?: (studentId: string) => void;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '').trim();
      if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function ModuleWorkspace({
  moduleId,
  user,
  contents,
  completedIds,
  submissions,
  onToggleComplete,
  onSubmissionCreated,
  onSubmissionReviewed,
}: ModuleWorkspaceProps) {
  const moduleMeta = MODULES.find((m) => m.id === moduleId)!;
  const moduleItems = useMemo(
    () => contents.filter((c) => c.moduleId === moduleId),
    [contents, moduleId]
  );

  const [levelFilter, setLevelFilter] = useState<'Semua' | 'Dasar' | 'Menengah' | 'Lanjut'>('Semua');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [arabicScale, setArabicScale] = useState<'normal' | 'large'>('normal');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { feedback: string; score: string }>>({});

  const filteredItems = useMemo(() => {
    if (levelFilter === 'Semua') return moduleItems;
    return moduleItems.filter((item) => item.level === levelFilter);
  }, [moduleItems, levelFilter]);

  const activeItem =
    filteredItems.find((i) => i.id === selectedId) || filteredItems[0] || null;

  function speakArabic(text: string, id: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSubmitPractice(e: FormEvent) {
    e.preventDefault();
    if (!activeItem || !answerText.trim()) return;
    setSubmitting(true);
    setSubmitNotice('');
    try {
      const res = await api.createSubmission(activeItem.id, answerText.trim());
      onSubmissionCreated(res.submission);
      setAnswerText('');
      setSubmitNotice('Jawaban Anda berhasil dikirim ke Perancang (Ilman Alfarizi).');
    } catch (err) {
      setSubmitNotice(err instanceof Error ? err.message : 'Gagal mengirim jawaban.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(subId: string) {
    const draft = reviewDrafts[subId];
    if (!draft?.feedback?.trim()) return;
    const numericScore = draft.score ? Number(draft.score) : undefined;
    const res = await api.reviewSubmission(subId, draft.feedback.trim(), numericScore);
    onSubmissionReviewed(res.submission);
  }

  const itemSubmissions = useMemo(() => {
    if (!activeItem) return [];
    return submissions.filter((s) => s.contentId === activeItem.id);
  }, [submissions, activeItem]);

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D9CEB4]">
        <div>
          <p className="font-arabic text-2xl font-bold text-[#B68924] leading-tight">
            {moduleMeta.arabicLabel}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-0.5">
            {moduleMeta.label}
          </h1>
          <p className="text-sm text-[#52675E] mt-1">{moduleMeta.description}</p>
        </div>

        {/* Interactive filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#EFE7D3] rounded-xl self-start">
          {(['Semua', 'Dasar', 'Menengah', 'Lanjut'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                levelFilter === lvl
                  ? 'bg-[#0B4334] text-[#F9F5EB]'
                  : 'text-[#52675E] hover:text-[#142921]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-10 text-center">
          <p className="font-display text-lg font-semibold text-[#142921]">
            Belum ada konten pada kategori ini
          </p>
          <p className="text-sm text-[#52675E] mt-1">
            {user.role === 'designer'
              ? 'Gunakan menu Kelola Konten untuk menambahkan materi atau unggahan video baru.'
              : 'Perancang aplikasi belum menambahkan konten baru di bagian ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left topic list */}
          <div className="lg:col-span-4 space-y-2.5">
            {filteredItems.map((item, idx) => {
              const isSelected = activeItem?.id === item.id;
              const isDone = completedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setSubmitNotice('');
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B4334] text-[#F9F5EB] border-[#0B4334]'
                      : 'bg-[#FFFDF8] text-[#142921] border-[#D9CEB4] hover:border-[#C99A2E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-[#E2BE5B]' : 'text-[#52675E]'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')} · {item.level}
                    </span>
                    {isDone && (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#E2BE5B]' : 'text-[#0B4334]'
                        }`}
                      />
                    )}
                  </div>
                  <p className="font-semibold text-sm mt-1 leading-snug">{item.title}</p>
                  {item.arabicTitle && (
                    <p
                      className={`font-arabic text-base mt-1 ${
                        isSelected ? 'text-[#E2BE5B]' : 'text-[#0B4334]'
                      }`}
                    >
                      {item.arabicTitle}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right active lesson reader */}
          {activeItem && (
            <article className="lg:col-span-8 bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#EAE1CA]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#52675E]">
                    <span>{moduleMeta.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tingkat {activeItem.level}</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#142921]">
                    {activeItem.title}
                  </h2>
                  {activeItem.arabicTitle && (
                    <p className="font-arabic text-2xl font-bold text-[#0B4334]">
                      {activeItem.arabicTitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setArabicScale((s) => (s === 'normal' ? 'large' : 'normal'))}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D4CBB4] text-xs font-semibold text-[#142921] hover:bg-[#F2ECDC] transition-colors cursor-pointer"
                  >
                    {arabicScale === 'normal' ? 'Perbesar Teks Arab' : 'Ukuran Normal'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleComplete(activeItem.id)}
                    className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                      completedIds.includes(activeItem.id)
                        ? 'bg-[#0B4334] text-[#F9F5EB]'
                        : 'bg-[#F2ECDC] text-[#142921] hover:bg-[#E7DEC6]'
                    }`}
                  >
                    {completedIds.includes(activeItem.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#E2BE5B]" />
                        <span>Sudah Dipelajari</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Tandai Selesai</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#364D44] leading-relaxed">
                {activeItem.summary}
              </p>

              {/* Media Player (Video Upload / Link or Audio Upload / Link) */}
              {activeItem.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-[#D9CEB4] bg-[#072F24]">
                  {(() => {
                    const yt = getYouTubeEmbedUrl(activeItem.mediaUrl);
                    if (yt) {
                      return (
                        <div className="aspect-video w-full">
                          <iframe
                            src={yt}
                            title={activeItem.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    if (activeItem.mediaKind === 'audio') {
                      return (
                        <div className="p-5 flex flex-col gap-3">
                          <p className="text-xs font-semibold text-[#E2BE5B]">
                            Pemutar Audio Pembelajaran
                          </p>
                          <audio controls src={activeItem.mediaUrl} className="w-full" />
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        <video
                          controls
                          playsInline
                          src={activeItem.mediaUrl}
                          className="w-full max-h-[420px] bg-black"
                        />
                        <div className="px-4 py-2 flex items-center justify-between text-xs text-[#C7D6CF]">
                          <span>
                            {activeItem.mediaType === 'upload'
                              ? 'Video diunggah langsung oleh perancang'
                              : 'Tautan video pembelajaran'}
                          </span>
                          <a
                            href={activeItem.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#E2BE5B] hover:underline"
                          >
                            <span>Buka tautan</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Arabic Text Block */}
              {activeItem.arabicText && (
                <div className="rounded-2xl bg-[#F4EFE0] border border-[#C99A2E]/35 p-5 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#0B4334]">
                      Teks Bahasa Arab (Fashihah & Berharakat)
                    </span>
                    <button
                      type="button"
                      onClick={() => speakArabic(activeItem.arabicText!, activeItem.id)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {speakingId === activeItem.id ? (
                        <>
                          <VolumeX className="w-4 h-4 text-[#E2BE5B]" />
                          <span>Hentikan Suara</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-[#E2BE5B]" />
                          <span>Dengarkan Pelafalan</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p
                    className={`font-arabic text-[#142921] whitespace-pre-line ${
                      arabicScale === 'large'
                        ? 'text-3xl sm:text-4xl'
                        : 'text-2xl sm:text-[28px]'
                    }`}
                  >
                    {activeItem.arabicText}
                  </p>

                  {activeItem.translation && (
                    <div className="pt-4 border-t border-[#D9CEB4]">
                      <p className="text-xs font-semibold text-[#52675E] mb-1">Terjemahan</p>
                      <p className="text-sm sm:text-base text-[#142921] leading-relaxed whitespace-pre-line">
                        {activeItem.translation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {activeItem.explanation && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[#0B4334]">Penjelasan & Kaidah</h3>
                  <div className="text-sm sm:text-base text-[#2B4239] leading-relaxed whitespace-pre-line bg-[#FAF7EE] rounded-xl p-5 border border-[#E6DEC8]">
                    {activeItem.explanation}
                  </div>
                </div>
              )}

              {/* Vocabulary List */}
              {activeItem.vocabulary && activeItem.vocabulary.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#0B4334]">Mufradat & Ungkapan Kunci</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeItem.vocabulary.map((v, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E6DEC8] flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#142921]">{v.meaning}</p>
                          {v.transliteration && (
                            <p className="text-xs text-[#52675E] italic">{v.transliteration}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => speakArabic(v.arabic, `${activeItem.id}-v-${i}`)}
                          title="Dengarkan pelafalan"
                          className="font-arabic text-xl font-bold text-[#0B4334] hover:text-[#B68924] transition-colors shrink-0 cursor-pointer"
                        >
                          {v.arabic}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Submission Box (for Menulis, Menganalisis, Menerjemah, or any item with promptTask) */}
              {(activeItem.promptTask || moduleMeta.supportsSubmission) && (
                <div className="pt-6 border-t border-[#EAE1CA] space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#142921]">
                      Tugas Latihan {moduleMeta.label}
                    </h3>
                    <p className="text-sm text-[#364D44] mt-1">
                      {activeItem.promptTask ||
                        'Tuliskan hasil latihan Anda di bawah ini untuk ditinjau langsung oleh perancang aplikasi.'}
                    </p>
                  </div>

                  {user.role === 'student' && (
                    <form onSubmit={handleSubmitPractice} className="space-y-3">
                      <textarea
                        rows={4}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Tulis jawaban bahasa Arab atau analisis Anda di sini..."
                        className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {submitNotice ? (
                          <span className="text-xs font-medium text-[#0B4334]">{submitNotice}</span>
                        ) : (
                          <span className="text-xs text-[#52675E]">
                            Jawaban dikirim langsung ke akun Perancang (Ilman Alfarizi).
                          </span>
                        )}
                        <button
                          type="submit"
                          disabled={submitting || !answerText.trim()}
                          className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>{submitting ? 'Mengirim...' : 'Kirim Latihan'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {itemSubmissions.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-semibold text-[#52675E]">
                        {user.role === 'designer'
                          ? `Kiriman Latihan Pelajar (${itemSubmissions.length})`
                          : 'Riwayat Jawaban Anda'}
                      </p>
                      {itemSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E6DEC8] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-[#52675E]">
                            <span className="font-semibold text-[#142921]">
                              {sub.userName} ({sub.userEmail})
                            </span>
                            <span>
                              {sub.status === 'reviewed'
                                ? `Dikoreksi${sub.score !== undefined ? ` · Nilai ${sub.score}` : ''}`
                                : 'Menunggu koreksi'}
                            </span>
                          </div>
                          <p className="text-sm text-[#142921] whitespace-pre-line bg-white p-3 rounded-lg border border-[#EAE1CA]">
                            {sub.answerText}
                          </p>
                          {sub.designerFeedback && (
                            <div className="text-xs text-[#0B4334] bg-[#0B4334]/8 rounded-lg p-3 flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold">Koreksi Perancang: </span>
                                <span>{sub.designerFeedback}</span>
                              </div>
                            </div>
                          )}

                          {user.role === 'designer' && (
                            <div className="pt-2 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Tulis koreksi/masukan untuk pelajar..."
                                value={reviewDrafts[sub.id]?.feedback ?? sub.designerFeedback ?? ''}
                                onChange={(e) =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      feedback: e.target.value,
                                      score: prev[sub.id]?.score ?? (sub.score?.toString() || ''),
                                    },
                                  }))
                                }
                                className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D4CBB4] text-xs"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="Nilai"
                                value={reviewDrafts[sub.id]?.score ?? (sub.score?.toString() || '')}
                                onChange={(e) =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [sub.id]: {
                                      feedback: prev[sub.id]?.feedback ?? sub.designerFeedback ?? '',
                                      score: e.target.value,
                                    },
                                  }))
                                }
                                className="w-24 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D4CBB4] text-xs tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => handleReview(sub.id)}
                                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#0B4334] text-[#F9F5EB] text-xs font-semibold cursor-pointer"
                              >
                                Simpan Koreksi
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      )}
    </div>
  );
}
