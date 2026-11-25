import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Edit3,
  Film,
  Link2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { api } from '../api';
import { MODULES } from '../constants';
import type { ContentItem, ModuleId, VocabularyItem } from '../types';

interface DesignerContentManagerProps {
  contents: ContentItem[];
  onContentCreated: (item: ContentItem) => void;
  onContentUpdated: (item: ContentItem) => void;
  onContentDeleted: (id: string) => void;
}

export function DesignerContentManager({
  contents,
  onContentCreated,
  onContentUpdated,
  onContentDeleted,
}: DesignerContentManagerProps) {
  const [filterModule, setFilterModule] = useState<'all' | ModuleId>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [moduleId, setModuleId] = useState<ModuleId>('materi');
  const [title, setTitle] = useState('');
  const [arabicTitle, setArabicTitle] = useState('');
  const [level, setLevel] = useState<'Dasar' | 'Menengah' | 'Lanjut'>('Dasar');
  const [summary, setSummary] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [translation, setTranslation] = useState('');
  const [explanation, setExplanation] = useState('');
  const [promptTask, setPromptTask] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'link' | 'upload'>('none');
  const [mediaKind, setMediaKind] = useState<'video' | 'audio'>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const filteredContents = useMemo(() => {
    if (filterModule === 'all') return contents;
    return contents.filter((c) => c.moduleId === filterModule);
  }, [contents, filterModule]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setArabicTitle('');
    setLevel('Dasar');
    setSummary('');
    setArabicText('');
    setTranslation('');
    setExplanation('');
    setPromptTask('');
    setMediaType('none');
    setMediaKind('video');
    setMediaUrl('');
    setUploadedFileName('');
    setVocabulary([]);
  }

  function startEdit(item: ContentItem) {
    setEditingId(item.id);
    setModuleId(item.moduleId);
    setTitle(item.title);
    setArabicTitle(item.arabicTitle || '');
    setLevel(item.level);
    setSummary(item.summary);
    setArabicText(item.arabicText || '');
    setTranslation(item.translation || '');
    setExplanation(item.explanation || '');
    setPromptTask(item.promptTask || '');
    setMediaType(item.mediaType || 'none');
    setMediaKind(item.mediaKind || 'video');
    setMediaUrl(item.mediaUrl || '');
    setUploadedFileName(item.mediaType === 'upload' ? item.mediaUrl || '' : '');
    setVocabulary(item.vocabulary || []);
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await api.uploadMedia(file);
      setMediaType('upload');
      setMediaKind(res.mediaKind);
      setMediaUrl(res.url);
      setUploadedFileName(res.originalName);
      setNotice(`File "${res.originalName}" berhasil diunggah ke server.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah video/audio.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!title.trim() || !summary.trim()) {
      setError('Judul dan ringkasan materi wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const cleanVocab = vocabulary.filter((v) => v.arabic.trim() && v.meaning.trim());
      const payload = {
        moduleId,
        title: title.trim(),
        arabicTitle: arabicTitle.trim(),
        level,
        summary: summary.trim(),
        arabicText: arabicText.trim(),
        translation: translation.trim(),
        explanation: explanation.trim(),
        promptTask: promptTask.trim(),
        vocabulary: cleanVocab,
        mediaType,
        mediaKind,
        mediaUrl: mediaType === 'none' ? '' : mediaUrl.trim(),
      };

      if (editingId) {
        const res = await api.updateContent(editingId, payload);
        onContentUpdated(res.content);
        setNotice('Perubahan materi berhasil disimpan.');
      } else {
        const res = await api.createContent(payload);
        onContentCreated(res.content);
        setNotice('Materi baru berhasil diterbitkan untuk semua pelajar.');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan konten.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteContent(id);
      onContentDeleted(id);
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus konten.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-[#D9CEB4]">
        <p className="text-xs font-semibold text-[#B68924]">Panel Perancang Aplikasi</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
          Kelola Konten 9 Modul Bahasa Arab
        </h1>
        <p className="text-sm text-[#52675E] mt-1">
          Tambahkan materi, unggah video/audio langsung dari penyimpanan Android maupun tautan link, cerita berharakat, latihan menulis, istima’, analisis, terjemah, ungkapan, dan pola kalimat.
        </p>
      </div>

      {/* Form Editor */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#FFFDF8] border border-[#C99A2E]/35 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-[#142921]">
            {editingId ? 'Edit Konten Pembelajaran' : 'Tambah Konten Pembelajaran Baru'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-[#52675E] hover:text-[#142921] cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#DC2626]/30 text-sm text-[#991B1B]">
            {error}
          </div>
        )}
        {notice && (
          <div className="p-3.5 rounded-xl bg-[#EEF7F3] border border-[#0B4334]/25 text-sm text-[#0B4334]">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Kategori Modul
            </label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value as ModuleId)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            >
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.arabicLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Tingkat Kesulitan
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as 'Dasar' | 'Menengah' | 'Lanjut')}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            >
              <option value="Dasar">Dasar</option>
              <option value="Menengah">Menengah</option>
              <option value="Lanjut">Lanjut</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Judul Arab (Opsional)
            </label>
            <input
              type="text"
              dir="rtl"
              value={arabicTitle}
              onChange={(e) => setArabicTitle(e.target.value)}
              placeholder="مثال: أَقْسَامُ الْكَلِمَةِ"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] font-arabic text-base text-[#142921]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Judul Konten (Indonesia) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kaidah Mubtada dan Khabar"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Ringkasan Singkat *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Deskripsi singkat materi yang tampil di daftar"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            />
          </div>
        </div>

        {/* Media Upload or Link Section */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#FAF7EE] border border-[#E6DEC8] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#142921]">
                Media Video atau Audio (Link maupun Unggah dari Android/Downloads)
              </p>
              <p className="text-xs text-[#52675E]">
                Pilih tautan YouTube/URL atau unggah langsung file MP4, WebM, MP3, WAV, M4A dari perangkat Anda.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#EFE7D3] rounded-xl">
              {[
                { id: 'none', label: 'Tanpa Media' },
                { id: 'link', label: 'Tautan Link' },
                { id: 'upload', label: 'Unggah File Android/PC' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMediaType(tab.id as 'none' | 'link' | 'upload')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mediaType === tab.id
                      ? 'bg-[#0B4334] text-[#F9F5EB]'
                      : 'text-[#52675E] hover:text-[#142921]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {mediaType === 'link' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[#52675E] mb-1">
                  Tautan URL Video / Audio
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[#52675E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... atau tautan file .mp4/.mp3"
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#52675E] mb-1">Jenis Media</label>
                <select
                  value={mediaKind}
                  onChange={(e) => setMediaKind(e.target.value as 'video' | 'audio')}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio (Istima’)</option>
                </select>
              </div>
            </div>
          )}

          {mediaType === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed border-[#C99A2E]/60 bg-white hover:bg-[#FAF7EE] cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B4334]/10 flex items-center justify-center text-[#0B4334]">
                    {uploading ? <Film className="w-5 h-5 animate-pulse" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#142921]">
                      {uploading
                        ? 'Sedang mengunggah file...'
                        : 'Pilih Video atau Audio dari Penyimpanan Android / Unduhan'}
                    </p>
                    <p className="text-xs text-[#52675E]">
                      Mendukung MP4, WebM, MOV, MP3, WAV, M4A (maks. 150 MB)
                    </p>
                  </div>
                </div>
                <span className="min-h-[38px] px-4 py-2 rounded-lg bg-[#0B4334] text-[#F9F5EB] text-xs font-semibold whitespace-nowrap">
                  Pilih File
                </span>
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {mediaUrl && (
                <p className="text-xs font-medium text-[#0B4334]">
                  Media siap disimpan: {uploadedFileName || mediaUrl} ({mediaKind === 'audio' ? 'Audio' : 'Video'})
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Teks Bahasa Arab (Berharakat)
            </label>
            <textarea
              rows={4}
              dir="rtl"
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              placeholder="اكتب النص العربي هنا..."
              className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] font-arabic text-xl text-[#142921]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Terjemahan Bahasa Indonesia
            </label>
            <textarea
              rows={4}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Tuliskan terjemahan bahasa Indonesia..."
              className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Penjelasan Kaidah / Catatan Materi
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Uraikan penjelasan nahwu, sharaf, atau hikmah cerita..."
              className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Instruksi Latihan / Tugas Pelajar (Opsional)
            </label>
            <textarea
              rows={3}
              value={promptTask}
              onChange={(e) => setPromptTask(e.target.value)}
              placeholder="Contoh: Terjemahkan kalimat di atas atau tuliskan analisis I'rabnya..."
              className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921]"
            />
          </div>
        </div>

        {/* Vocabulary Builder */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#142921]">
              Kosakata / Mufradat Kunci ({vocabulary.length})
            </span>
            <button
              type="button"
              onClick={() =>
                setVocabulary((prev) => [...prev, { arabic: '', transliteration: '', meaning: '' }])
              }
              className="min-h-[36px] px-3 py-1 rounded-lg bg-[#F2ECDC] hover:bg-[#E7DEC6] text-xs font-semibold text-[#0B4334] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kosakata</span>
            </button>
          </div>
          {vocabulary.map((v, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                dir="rtl"
                placeholder="Lafaz Arab"
                value={v.arabic}
                onChange={(e) =>
                  setVocabulary((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, arabic: e.target.value } : item))
                  )
                }
                className="sm:col-span-4 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D4CBB4] font-arabic text-base"
              />
              <input
                type="text"
                placeholder="Cara baca (opsional)"
                value={v.transliteration || ''}
                onChange={(e) =>
                  setVocabulary((prev) =>
                    prev.map((item, i) =>
                      i === idx ? { ...item, transliteration: e.target.value } : item
                    )
                  )
                }
                className="sm:col-span-3 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D4CBB4] text-xs"
              />
              <input
                type="text"
                placeholder="Arti bahasa Indonesia"
                value={v.meaning}
                onChange={(e) =>
                  setVocabulary((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, meaning: e.target.value } : item))
                  )
                }
                className="sm:col-span-4 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#D4CBB4] text-xs"
              />
              <button
                type="button"
                onClick={() => setVocabulary((prev) => prev.filter((_, i) => i !== idx))}
                aria-label="Hapus kosakata"
                className="sm:col-span-1 min-h-[40px] flex items-center justify-center text-[#991B1B] hover:bg-[#FDF2F2] rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? 'Menyimpan...'
              : editingId
              ? 'Simpan Perubahan'
              : 'Terbitkan ke Aplikasi'}
          </button>
        </div>
      </form>

      {/* Content Directory */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-[#142921]">
            Daftar Konten Terbit ({filteredContents.length})
          </h2>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value as 'all' | ModuleId)}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FFFDF8] border border-[#D4CBB4] text-xs font-semibold text-[#142921]"
          >
            <option value="all">Semua Modul (9 Kategori)</option>
            {MODULES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContents.map((item) => {
            const mod = MODULES.find((m) => m.id === item.moduleId);
            return (
              <div
                key={item.id}
                className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#52675E]">
                    <span>
                      {mod?.label} · {item.level}
                    </span>
                    {item.mediaUrl && (
                      <span className="font-medium text-[#0B4334]">
                        {item.mediaType === 'upload' ? 'File Unggahan' : 'Link Media'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base text-[#142921] mt-1">{item.title}</h3>
                  <p className="text-xs text-[#52675E] mt-1 line-clamp-2">{item.summary}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE1CA]">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#F2ECDC] hover:bg-[#E7DEC6] text-xs font-semibold text-[#142921] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#FDF2F2] hover:bg-[#FBE4E4] text-xs font-semibold text-[#991B1B] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
