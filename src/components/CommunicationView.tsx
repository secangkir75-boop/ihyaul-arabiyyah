import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { MessageCircle, RefreshCw, Send } from 'lucide-react';
import { api } from '../api';
import type { Message, StudentDirectoryEntry, User } from '../types';

interface CommunicationViewProps {
  user: User;
  messages: Message[];
  students: StudentDirectoryEntry[];
  initialThreadUserId?: string | null;
  onMessageSent: (msg: Message) => void;
  onRefreshMessages: () => Promise<void>;
}

export function CommunicationView({
  user,
  messages,
  students,
  initialThreadUserId,
  onMessageSent,
  onRefreshMessages,
}: CommunicationViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    user.role === 'designer' ? initialThreadUserId || null : user.id
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (initialThreadUserId && user.role === 'designer') {
      setSelectedThreadId(initialThreadUserId);
    }
  }, [initialThreadUserId, user.role]);

  useEffect(() => {
    const timer = setInterval(() => {
      onRefreshMessages().catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [onRefreshMessages]);

  // Build threads list for Designer combining active messages + registered students
  const designerThreads = useMemo(() => {
    if (user.role !== 'designer') return [];
    const map = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        lastMessage?: string;
        lastAt?: string;
        unread: number;
      }
    >();

    for (const s of students) {
      map.set(s.user.id, {
        userId: s.user.id,
        name: s.user.name,
        email: s.user.email,
        unread: 0,
      });
    }

    for (const m of messages) {
      const existing = map.get(m.threadUserId) || {
        userId: m.threadUserId,
        name: m.threadUserName,
        email: m.threadUserEmail,
        unread: 0,
      };
      existing.lastMessage = m.text;
      existing.lastAt = m.createdAt;
      if (!m.readByDesigner && m.senderRole === 'student') {
        existing.unread += 1;
      }
      map.set(m.threadUserId, existing);
    }

    return Array.from(map.values()).sort((a, b) =>
      (b.lastAt || '').localeCompare(a.lastAt || '')
    );
  }, [user.role, students, messages]);

  const activeThreadId =
    user.role === 'designer'
      ? selectedThreadId || designerThreads[0]?.userId || null
      : user.id;

  const activeMessages = useMemo(() => {
    if (!activeThreadId) return [];
    return messages.filter((m) => m.threadUserId === activeThreadId);
  }, [messages, activeThreadId]);

  useEffect(() => {
    if (activeThreadId && activeMessages.length > 0) {
      api.markMessagesRead(activeThreadId).catch(() => {});
    }
  }, [activeThreadId, activeMessages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (user.role === 'designer' && !activeThreadId) return;
    setSending(true);
    try {
      const res = await api.sendMessage(
        text.trim(),
        user.role === 'designer' ? activeThreadId || undefined : undefined
      );
      onMessageSent(res.message);
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#D9CEB4]">
        <div>
          <p className="font-arabic text-2xl font-bold text-[#B68924]">التَّوَاصُلُ وَالِاسْتِشَارَة</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-0.5">
            Komunikasi Pelajar & Perancang
          </h1>
          <p className="text-sm text-[#52675E] mt-1">
            {user.role === 'designer'
              ? 'Balas pertanyaan belajar, konsultasi kaidah, dan konfirmasi sertifikat pelajar secara langsung.'
              : 'Bertanya langsung kepada perancang aplikasi (Ilman Alfarizi) seputar materi, latihan, dan ujian.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRefreshMessages()}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F2ECDC] hover:bg-[#E7DEC6] text-xs font-semibold text-[#142921] inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Perbarui Pesan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {user.role === 'designer' && (
          <aside className="lg:col-span-4 bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-4 space-y-2 max-h-[540px] overflow-y-auto">
            <p className="text-xs font-semibold text-[#52675E] px-2 pb-1">
              Daftar Pelajar ({designerThreads.length})
            </p>
            {designerThreads.length === 0 ? (
              <p className="text-xs text-[#52675E] p-3">
                Belum ada pelajar yang terdaftar.
              </p>
            ) : (
              designerThreads.map((t) => {
                const isSelected = activeThreadId === t.userId;
                return (
                  <button
                    key={t.userId}
                    type="button"
                    onClick={() => setSelectedThreadId(t.userId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B4334] text-[#F9F5EB] border-[#0B4334]'
                        : 'bg-white text-[#142921] border-[#EAE1CA] hover:border-[#C99A2E]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{t.name}</span>
                      {t.unread > 0 && (
                        <span className="text-xs font-bold text-[#E2BE5B] tabular-nums">
                          {t.unread} baru
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isSelected ? 'text-[#C7D6CF]' : 'text-[#52675E]'
                      }`}
                    >
                      {t.lastMessage || t.email}
                    </p>
                  </button>
                );
              })
            )}
          </aside>
        )}

        <section
          className={`${
            user.role === 'designer' ? 'lg:col-span-8' : 'lg:col-span-12'
          } bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl flex flex-col h-[540px] overflow-hidden`}
        >
          <div className="px-5 py-4 bg-[#072F24] text-[#F9F5EB] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-[#E2BE5B]" />
              <div>
                <p className="text-sm font-semibold">
                  {user.role === 'designer'
                    ? designerThreads.find((t) => t.userId === activeThreadId)?.name ||
                      'Pilih Pelajar'
                    : 'Ilman Alfarizi (Perancang Aplikasi)'}
                </p>
                <p className="text-xs text-[#C7D6CF]">
                  {user.role === 'designer'
                    ? designerThreads.find((t) => t.userId === activeThreadId)?.email ||
                      'Ruang percakapan pelajar'
                    : 'UIN Mataram · Pembimbing & Perancang Iḥyā’ul ‘Arabiyyah'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#FAF7EE]">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="font-display text-lg font-semibold text-[#142921]">
                  Mulai Percakapan
                </p>
                <p className="text-xs text-[#52675E] mt-1 max-w-sm">
                  {user.role === 'designer'
                    ? 'Pilih pelajar di sebelah kiri untuk menyapa atau menindaklanjuti progres belajarnya.'
                    : 'Tuliskan salam atau pertanyaan bahasa Arab Anda di kolom bawah untuk berkomunikasi dengan Ilman Alfarizi.'}
                </p>
              </div>
            ) : (
              activeMessages.map((m) => {
                const isMine = m.senderId === user.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-[#0B4334] text-[#F9F5EB]'
                          : 'bg-white border border-[#D9CEB4] text-[#142921]'
                      }`}
                    >
                      <p className="text-[11px] font-semibold opacity-80 mb-1">
                        {m.senderName}
                      </p>
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className="text-[11px] text-[#52675E] mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-4 bg-[#FFFDF8] border-t border-[#D9CEB4] flex items-center gap-3"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={user.role === 'designer' && !activeThreadId}
              placeholder="Tulis pesan Anda di sini..."
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
            />
            <button
              type="submit"
              disabled={sending || !text.trim() || (user.role === 'designer' && !activeThreadId)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#E2BE5B]" />
              <span>Kirim</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
