import { useState, type FormEvent } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Printer,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api } from '../api';
import type { Certificate, ExamAttempt, ExamQuestion, User } from '../types';
import { EmblemLogo } from './EmblemLogo';

interface ExamAndCertificateViewProps {
  mode: 'student-exam' | 'designer-exam' | 'designer-results';
  user: User;
  questions: ExamQuestion[];
  attempts: ExamAttempt[];
  certificates: Certificate[];
  onQuestionAdded: (q: ExamQuestion) => void;
  onQuestionDeleted: (id: string) => void;
  onExamSubmitted: (attempt: ExamAttempt) => void;
  onCertificateIssued: (cert: Certificate) => void;
  onCertificateAcknowledged: (cert: Certificate) => void;
}

export function ExamAndCertificateView({
  mode,
  user,
  questions,
  attempts,
  certificates,
  onQuestionAdded,
  onQuestionDeleted,
  onExamSubmitted,
  onCertificateIssued,
  onCertificateAcknowledged,
}: ExamAndCertificateViewProps) {
  // Student exam state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submittingExam, setSubmittingExam] = useState(false);
  const [latestResult, setLatestResult] = useState<{
    attempt: ExamAttempt;
    details: Array<{
      questionId: string;
      correctIndex: number;
      chosenIndex: number;
      isCorrect: boolean;
      explanation?: string;
    }>;
  } | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(
    certificates[0] || null
  );

  // Designer question form
  const [qText, setQText] = useState('');
  const [qArabic, setQArabic] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [savingQ, setSavingQ] = useState(false);

  // Designer issue certificate note
  const [certNotes, setCertNotes] = useState<Record<string, string>>({});
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const unacknowledgedCerts = certificates.filter((c) => !c.acknowledgedAt);

  async function handleSubmitExam(e: FormEvent) {
    e.preventDefault();
    setError('');
    const answerArray = questions.map((_, idx) =>
      typeof answers[idx] === 'number' ? answers[idx] : -1
    );
    if (answerArray.some((a) => a === -1)) {
      setError('Mohon jawab seluruh soal ujian terlebih dahulu sebelum mengirim.');
      return;
    }
    setSubmittingExam(true);
    try {
      const res = await api.submitExam(answerArray);
      setLatestResult(res);
      onExamSubmitted(res.attempt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim jawaban ujian.');
    } finally {
      setSubmittingExam(false);
    }
  }

  async function handleAddQuestion(e: FormEvent) {
    e.preventDefault();
    setError('');
    const options = [opt0, opt1, opt2, opt3].map((o) => o.trim()).filter(Boolean);
    if (!qText.trim() || options.length < 2) {
      setError('Pertanyaan dan minimal 2 pilihan jawaban wajib diisi.');
      return;
    }
    setSavingQ(true);
    try {
      const res = await api.createExamQuestion({
        question: qText.trim(),
        arabicPrompt: qArabic.trim(),
        options,
        correctIndex: Math.min(correctIdx, options.length - 1),
        explanation: qExplanation.trim(),
      });
      onQuestionAdded(res.question);
      setQText('');
      setQArabic('');
      setOpt0('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      setCorrectIdx(0);
      setQExplanation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan soal.');
    } finally {
      setSavingQ(false);
    }
  }

  async function handleIssueCert(attemptId: string) {
    setError('');
    setIssuingId(attemptId);
    try {
      const res = await api.issueCertificate(attemptId, certNotes[attemptId]);
      onCertificateIssued(res.certificate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim sertifikat.');
    } finally {
      setIssuingId(null);
    }
  }

  async function handleAcknowledgeCert(cert: Certificate) {
    const res = await api.acknowledgeCertificate(cert.id);
    onCertificateAcknowledged(res.certificate);
    setSelectedCert(res.certificate);
  }

  // DESIGNER: Manage Exam Questions
  if (mode === 'designer-exam') {
    return (
      <div className="space-y-8">
        <div className="pb-5 border-b border-[#D9CEB4]">
          <p className="text-xs font-semibold text-[#B68924]">Panel Perancang</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
            Kelola Soal Ujian Bahasa Arab
          </h1>
          <p className="text-sm text-[#52675E] mt-1">
            Susun soal evaluasi bagi pelajar. Nilai ≥ 60 mendapat predikat Maqbūl hingga Mumtāz dan berhak menerima sertifikat.
          </p>
        </div>

        <form
          onSubmit={handleAddQuestion}
          className="bg-[#FFFDF8] border border-[#C99A2E]/35 rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#142921]">Tambah Soal Ujian Baru</h2>
          {error && (
            <div className="p-3 rounded-xl bg-[#FDF2F2] text-sm text-[#991B1B]">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#142921] mb-1">
                Pertanyaan (Bahasa Indonesia) *
              </label>
              <textarea
                rows={2}
                required
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Contoh: Manakah bentuk Fi'il Mudhari' yang tepat?"
                className="w-full p-3 rounded-xl bg-white border border-[#D4CBB4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#142921] mb-1">
                Kalimat / Teks Arab Soal (Opsional)
              </label>
              <textarea
                rows={2}
                dir="rtl"
                value={qArabic}
                onChange={(e) => setQArabic(e.target.value)}
                placeholder="مثال: يَكْتُبُ الطَّالِبُ الدَّرْسَ"
                className="w-full p-3 rounded-xl bg-white border border-[#D4CBB4] font-arabic text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Pilihan A', val: opt0, set: setOpt0 },
              { label: 'Pilihan B', val: opt1, set: setOpt1 },
              { label: 'Pilihan C', val: opt2, set: setOpt2 },
              { label: 'Pilihan D', val: opt3, set: setOpt3 },
            ].map((o, idx) => (
              <div key={idx}>
                <label className="block text-xs font-medium text-[#52675E] mb-1">
                  {o.label}
                </label>
                <input
                  type="text"
                  value={o.val}
                  onChange={(e) => o.set(e.target.value)}
                  placeholder={`Masukkan ${o.label}`}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#142921] mb-1">
                Kunci Jawaban Benar
              </label>
              <select
                value={correctIdx}
                onChange={(e) => setCorrectIdx(Number(e.target.value))}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
              >
                <option value={0}>Pilihan A</option>
                <option value={1}>Pilihan B</option>
                <option value={2}>Pilihan C</option>
                <option value={3}>Pilihan D</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#142921] mb-1">
                Pembahasan Singkat (Opsional)
              </label>
              <input
                type="text"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Penjelasan mengapa jawaban tersebut benar"
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingQ}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0B4334] text-[#F9F5EB] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{savingQ ? 'Menyimpan...' : 'Tambahkan Soal'}</span>
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#142921]">
            Bank Soal Ujian ({questions.length} Soal)
          </h2>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#B68924]">Soal {idx + 1}</p>
                <p className="font-semibold text-sm text-[#142921]">{q.question}</p>
                {q.arabicPrompt && (
                  <p className="font-arabic text-xl text-[#0B4334]">{q.arabicPrompt}</p>
                )}
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-[#52675E]">
                  {q.options.map((opt, oi) => (
                    <span
                      key={oi}
                      className={oi === q.correctIndex ? 'font-bold text-[#0B4334]' : ''}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                      {oi === q.correctIndex ? ' (Benar)' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => api.deleteExamQuestion(q.id).then(() => onQuestionDeleted(q.id))}
                aria-label="Hapus soal"
                className="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-[#991B1B] hover:bg-[#FDF2F2] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DESIGNER: View Exam Results & Issue Certificates
  if (mode === 'designer-results') {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#D9CEB4]">
          <p className="text-xs font-semibold text-[#B68924]">Panel Perancang</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
            Hasil Ujian & Penerbitan Sertifikat
          </h1>
          <p className="text-sm text-[#52675E] mt-1">
            Pantau hasil evaluasi pelajar dan kirimkan sertifikat resmi berpredikat Maqbūl (60+) hingga Mumtāz (90–100).
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF2F2] text-sm text-[#991B1B]">{error}</div>
        )}

        {attempts.length === 0 ? (
          <div className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-10 text-center">
            <p className="font-display text-lg font-semibold text-[#142921]">
              Belum ada pelajar yang mengikuti ujian
            </p>
            <p className="text-sm text-[#52675E] mt-1">
              Hasil ujian pelajar akan tampil di sini secara otomatis setelah mereka menyelesaikan soal ujian.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((att) => {
              const issuedCert = certificates.find((c) => c.attemptId === att.id);
              const eligible = att.score >= 60;
              return (
                <div
                  key={att.id}
                  className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-base text-[#142921]">{att.userName}</p>
                      <p className="text-xs text-[#52675E]">
                        {att.userEmail} · {new Date(att.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-[#52675E]">Skor Akhir</p>
                        <p className="text-2xl font-bold text-[#0B4334] tabular-nums">
                          {att.score}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#52675E]">Predikat</p>
                        <p className="font-display text-lg font-bold text-[#B68924]">
                          {att.predikat}
                        </p>
                      </div>
                    </div>
                  </div>

                  {issuedCert ? (
                    <div className="p-3.5 rounded-xl bg-[#EEF7F3] border border-[#0B4334]/25 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B4334]">
                      <span>
                        Sertifikat <strong>{issuedCert.certificateNumber}</strong> telah dikirim ke pelajar
                        {issuedCert.acknowledgedAt ? ' · Sudah diterima pelajar' : ' · Menunggu dibuka pelajar'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedCert(issuedCert)}
                        className="font-semibold underline cursor-pointer"
                      >
                        Pratinjau Sertifikat
                      </button>
                    </div>
                  ) : eligible ? (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#EAE1CA]">
                      <input
                        type="text"
                        placeholder="Catatan apresiasi dari perancang (opsional)..."
                        value={certNotes[att.id] || ''}
                        onChange={(e) =>
                          setCertNotes((prev) => ({ ...prev, [att.id]: e.target.value }))
                        }
                        className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-xs"
                      />
                      <button
                        type="button"
                        disabled={issuingId === att.id}
                        onClick={() => handleIssueCert(att.id)}
                        className="min-h-[42px] px-5 py-2 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#E2BE5B]" />
                        <span>
                          {issuingId === att.id
                            ? 'Mengirim...'
                            : `Kirim Sertifikat (${att.predikat})`}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#991B1B]">
                      Nilai belum mencapai batas minimal kelulusan (60 / Maqbūl). Pelajar dapat mengulang ujian.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedCert && (
          <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
        )}
      </div>
    );
  }

  // STUDENT: Exam & Certificate Prompt
  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[#D9CEB4]">
        <p className="font-arabic text-2xl font-bold text-[#B68924]">الِامْتِحَانُ وَالشَّهَادَة</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-0.5">
          Ujian Evaluasi & Sertifikat Kelulusan
        </h1>
        <p className="text-sm text-[#52675E] mt-1">
          Uji pemahaman bahasa Arab Anda. Pelajar yang meraih predikat Maqbūl hingga Mumtāz berhak menerima sertifikat resmi dari perancang aplikasi.
        </p>
      </div>

      {/* Prompt penerimaan sertifikat dari perancang */}
      {unacknowledgedCerts.length > 0 && (
        <div className="islamic-pattern-emerald text-[#F9F5EB] rounded-2xl p-6 border-2 border-[#C99A2E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C99A2E]/20 border border-[#C99A2E] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-[#E2BE5B]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#E2BE5B]">
                Pemberitahuan Sertifikat Baru dari Perancang
              </p>
              <h2 className="font-display text-xl font-bold mt-0.5">
                Selamat, {user.name}! Sertifikat Predikat {unacknowledgedCerts[0].predikat} Telah Dikirim
              </h2>
              <p className="text-sm text-[#D8E5DF] mt-1">
                Perancang aplikasi (Ilman Alfarizi) telah menerbitkan sertifikat resmi Anda dengan nilai{' '}
                <strong className="tabular-nums">{unacknowledgedCerts[0].score}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAcknowledgeCert(unacknowledgedCerts[0])}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#C99A2E] hover:bg-[#B68924] text-[#072F24] font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            Terima & Buka Sertifikat
          </button>
        </div>
      )}

      {/* Existing Certificates List */}
      {certificates.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-[#142921]">Sertifikat Saya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-[#FFFDF8] border border-[#C99A2E]/50 rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-semibold text-[#B68924]">{cert.certificateNumber}</p>
                  <p className="font-display text-lg font-bold text-[#142921] mt-0.5">
                    Predikat {cert.predikat} ({cert.arabicPredikat})
                  </p>
                  <p className="text-xs text-[#52675E] mt-1 tabular-nums">
                    Nilai {cert.score} · Diterbitkan {new Date(cert.issuedAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0B4334] text-[#F9F5EB] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Lihat Sertifikat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Form or Latest Result */}
      {latestResult ? (
        <div className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#EAE1CA]">
            <div>
              <p className="text-xs font-semibold text-[#52675E]">Hasil Evaluasi Ujian Anda</p>
              <h2 className="font-display text-2xl font-bold text-[#142921] mt-1">
                Predikat: {latestResult.attempt.predikat}
              </h2>
              <p className="text-sm text-[#52675E] mt-1 tabular-nums">
                Benar {latestResult.attempt.correctCount} dari {latestResult.attempt.totalQuestions} soal
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#52675E]">Skor Akhir</p>
              <p className="font-display text-4xl font-bold text-[#0B4334] tabular-nums">
                {latestResult.attempt.score}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E6DEC8] text-sm text-[#142921]">
            {latestResult.attempt.score >= 60 ? (
              <p>
                Selamat! Anda memenuhi syarat kelulusan ({latestResult.attempt.predikat}). Hasil ujian ini telah tercatat pada akun Perancang untuk proses pengiriman sertifikat.
              </p>
            ) : (
              <p>
                Nilai Anda belum mencapai batas minimal Maqbūl (60). Silakan tinjau kembali materi dan ulangi ujian kapan saja.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const d = latestResult.details[idx];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-[#EAE1CA] bg-white space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#142921]">
                      {idx + 1}. {q.question}
                    </p>
                    {d?.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0B4334] shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#52675E]">
                    Jawaban Anda: <strong>{q.options[d?.chosenIndex ?? -1] || '-'}</strong> · Kunci:{' '}
                    <strong className="text-[#0B4334]">{q.options[d?.correctIndex ?? 0]}</strong>
                  </p>
                  {d?.explanation && (
                    <p className="text-xs text-[#364D44] bg-[#FAF7EE] p-2.5 rounded-lg">
                      {d.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setLatestResult(null);
              setAnswers({});
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B4334] text-[#F9F5EB] text-sm font-semibold cursor-pointer"
          >
            Kerjakan Ujian Kembali
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitExam} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FDF2F2] text-sm text-[#991B1B]">{error}</div>
          )}

          {questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <p className="text-xs font-semibold text-[#B68924] tabular-nums">
                  Pertanyaan {qIdx + 1} dari {questions.length}
                </p>
                <p className="font-semibold text-base text-[#142921] mt-1">{q.question}</p>
                {q.arabicPrompt && (
                  <p className="font-arabic text-2xl text-[#0B4334] mt-2">{q.arabicPrompt}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, oIdx) => {
                  const chosen = answers[qIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                      className={`min-h-[46px] text-left px-4 py-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                        chosen
                          ? 'bg-[#0B4334] text-[#F9F5EB] border-[#0B4334] font-semibold'
                          : 'bg-white text-[#142921] border-[#D4CBB4] hover:border-[#C99A2E]'
                      }`}
                    >
                      <span className="mr-2 font-semibold">{String.fromCharCode(65 + oIdx)}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingExam || questions.length === 0}
              className="min-h-[48px] px-7 py-3 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-[#E2BE5B]" />
              <span>{submittingExam ? 'Menilai Jawaban...' : 'Kirim & Evaluasi Jawaban'}</span>
            </button>
          </div>
        </form>
      )}

      {selectedCert && (
        <CertificateModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
}

function CertificateModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#FFFDF8] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#0B4334]">
        <div className="p-6 sm:p-10 islamic-pattern-ivory border-4 border-double border-[#C99A2E] m-3 rounded-xl text-center space-y-5">
          <div className="flex justify-center">
            <EmblemLogo sizeClass="w-20 h-20" />
          </div>

          <div>
            <p className="font-arabic text-2xl font-bold text-[#0B4334]">شَهَادَةُ التَّقْدِيرِ وَالنَّجَاحِ</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
              SERTIFIKAT KELULUSAN
            </h2>
            <p className="text-xs text-[#52675E] mt-1">Nomor: {cert.certificateNumber}</p>
          </div>

          <p className="text-sm text-[#364D44]">Diberikan dengan hormat kepada:</p>

          <div className="py-2 border-b-2 border-[#C99A2E]/50 max-w-md mx-auto">
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#0B4334]">
              {cert.userName}
            </p>
            <p className="text-xs text-[#52675E] mt-0.5">{cert.userEmail}</p>
          </div>

          <p className="text-sm text-[#364D44] max-w-xl mx-auto leading-relaxed">
            Telah menyelesaikan rangkaian pembelajaran dan ujian evaluasi bahasa Arab pada platform{' '}
            <strong>Iḥyā’ul ‘Arabiyyah</strong> dengan nilai akhir{' '}
            <strong className="tabular-nums">{cert.score}</strong> dan meraih predikat:
          </p>

          <div className="inline-block px-8 py-3 rounded-xl bg-[#0B4334] text-[#F9F5EB] border border-[#C99A2E]">
            <p className="font-arabic text-2xl text-[#E2BE5B]">{cert.arabicPredikat}</p>
            <p className="font-display text-xl font-bold tracking-wide">{cert.predikat}</p>
          </div>

          {cert.note && (
            <p className="text-xs italic text-[#52675E] max-w-lg mx-auto">“{cert.note}”</p>
          )}

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#142921] border-t border-[#D9CEB4]">
            <div className="text-left">
              <p className="text-[#52675E]">Tanggal Diterbitkan</p>
              <p className="font-semibold">
                {new Date(cert.issuedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#52675E]">Perancang & Pengesah</p>
              <p className="font-display text-base font-bold text-[#0B4334] mt-1">
                Ilman Alfarizi
              </p>
              <p className="text-[#52675E]">UIN Mataram · NIM 240102065</p>
            </div>
          </div>
        </div>

        <div className="no-print px-6 py-4 bg-[#072F24] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C99A2E] text-[#072F24] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-white/10 text-[#F9F5EB] text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
