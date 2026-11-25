import { useState, type FormEvent } from 'react';
import {
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../api';
import type { DesignerInfo, StudentDirectoryEntry, User } from '../types';
import { EmblemLogo } from './EmblemLogo';

interface ProfileAndDirectoryViewProps {
  mode: 'profile' | 'students' | 'designer-bio';
  user: User;
  designerInfo: DesignerInfo;
  students: StudentDirectoryEntry[];
  onProfileUpdated: (user: User) => void;
  onOpenChat: (studentUserId?: string) => void;
}

export function ProfileAndDirectoryView({
  mode,
  user,
  designerInfo,
  students,
  onProfileUpdated,
  onOpenChat,
}: ProfileAndDirectoryViewProps) {
  const [name, setName] = useState(user.name);
  const [birthPlaceDate, setBirthPlaceDate] = useState(user.birthPlaceDate || '');
  const [region, setRegion] = useState(user.region || '');
  const [institution, setInstitution] = useState(user.institution || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const res = await api.updateProfile({
        name,
        birthPlaceDate,
        region,
        institution,
        phone,
        bio,
      });
      onProfileUpdated(res.user);
      setNotice('Data profil pribadi berhasil diperbarui.');
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'designer-bio') {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#D9CEB4]">
          <p className="font-arabic text-2xl font-bold text-[#B68924]">بَيَانَاتُ الْمُصَمِّم</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-0.5">
            Profil Perancang Aplikasi
          </h1>
          <p className="text-sm text-[#52675E] mt-1">
            Informasi resmi perancang dan pengelola kurikulum Iḥyā’ul ‘Arabiyyah.
          </p>
        </div>

        <div className="bg-[#FFFDF8] border border-[#C99A2E]/40 rounded-2xl overflow-hidden">
          <div className="islamic-pattern-emerald p-6 sm:p-8 text-[#F9F5EB] flex flex-col sm:flex-row sm:items-center gap-6">
            <EmblemLogo sizeClass="w-24 h-24" />
            <div>
              <p className="text-xs font-semibold text-[#E2BE5B]">{designerInfo.roleTitle}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                {designerInfo.name}
              </h2>
              <p className="text-sm text-[#D8E5DF] mt-1">
                {designerInfo.university} · NIM {designerInfo.nim}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-sm sm:text-base text-[#364D44] leading-relaxed">
              {designerInfo.vision}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Nama Lengkap', value: designerInfo.name, icon: UserIcon },
                { label: 'Tempat, Tanggal Lahir', value: designerInfo.birthPlaceDate, icon: GraduationCap },
                { label: 'Asal Daerah', value: designerInfo.region, icon: MapPin },
                { label: 'Perguruan Tinggi', value: `${designerInfo.university} (NIM ${designerInfo.nim})`, icon: GraduationCap },
                { label: 'Nomor HP / WhatsApp', value: designerInfo.phone, icon: Phone },
                { label: 'Email Perancang', value: designerInfo.email, icon: Mail },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E6DEC8] space-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#52675E]">
                      <Icon className="w-3.5 h-3.5 text-[#0B4334]" />
                      <span>{row.label}</span>
                    </div>
                    <p className="font-semibold text-sm text-[#142921]">{row.value}</p>
                  </div>
                );
              })}
            </div>

            {user.role === 'student' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenChat()}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#E2BE5B]" />
                  <span>Hubungi Perancang via Pesan Aplikasi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'students') {
    return (
      <div className="space-y-6">
        <div className="pb-5 border-b border-[#D9CEB4]">
          <p className="text-xs font-semibold text-[#B68924]">Panel Perancang</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-1">
            Data Pelajar Terdaftar ({students.length})
          </h1>
          <p className="text-sm text-[#52675E] mt-1">
            Pantau biodata pelajar, kemajuan belajar modul, nilai ujian, dan status sertifikat.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-10 text-center">
            <p className="font-display text-lg font-semibold text-[#142921]">
              Belum ada pelajar terdaftar
            </p>
            <p className="text-sm text-[#52675E] mt-1">
              Pelajar yang mendaftar melalui email pribadi atau email aplikasi akan tampil otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((entry) => (
              <div
                key={entry.user.id}
                className="bg-[#FFFDF8] border border-[#D9CEB4] rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#142921]">
                      {entry.user.name}
                    </h3>
                    <p className="text-xs text-[#52675E]">{entry.user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChat(entry.user.id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B4334] text-[#F9F5EB] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#E2BE5B]" />
                    <span>Pesan</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#364D44] bg-[#FAF7EE] p-3.5 rounded-xl border border-[#E6DEC8]">
                  <div>
                    <span className="text-[#52675E]">Daerah: </span>
                    <strong>{entry.user.region || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[#52675E]">Institusi: </span>
                    <strong>{entry.user.institution || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[#52675E]">Progres: </span>
                    <strong className="tabular-nums">
                      {entry.completedCount}/{entry.totalContents} konten
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#52675E]">Ujian Terakhir: </span>
                    <strong className="tabular-nums">
                      {entry.latestAttempt
                        ? `${entry.latestAttempt.score} (${entry.latestAttempt.predikat})`
                        : 'Belum ujian'}
                    </strong>
                  </div>
                </div>

                {entry.certificate && (
                  <p className="text-xs font-medium text-[#0B4334]">
                    Sertifikat Terbit: {entry.certificate.certificateNumber} ({entry.certificate.predikat})
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Personal Profile Editor ('profile')
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#D9CEB4]">
        <p className="font-arabic text-2xl font-bold text-[#B68924]">الْمِلَفُّ الشَّخْصِيّ</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#142921] mt-0.5">
          Data Diri & Profil Saya
        </h1>
        <p className="text-sm text-[#52675E] mt-1">
          Lengkapi biodata Anda agar tercantum dengan benar pada rekap pembelajaran dan sertifikat.
        </p>
      </div>

      <form
        onSubmit={handleSaveProfile}
        className="bg-[#FFFDF8] border border-[#C99A2E]/35 rounded-2xl p-6 sm:p-8 space-y-5 max-w-3xl"
      >
        {notice && (
          <div className="p-3.5 rounded-xl bg-[#EEF7F3] border border-[#0B4334]/25 text-sm text-[#0B4334]">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Email Akun (Tetap)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F2ECDC] border border-[#D4CBB4] text-sm text-[#52675E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Tempat, Tanggal Lahir
            </label>
            <input
              type="text"
              value={birthPlaceDate}
              onChange={(e) => setBirthPlaceDate(e.target.value)}
              placeholder="Contoh: Mataram, 12 Mei 2006"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Asal Daerah
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Contoh: Nusa Tenggara Barat"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Sekolah / Pesantren / Kampus
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Contoh: UIN Mataram"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#142921] mb-1.5">
              Nomor HP / WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#142921] mb-1.5">
            Catatan & Target Belajar Bahasa Arab
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tuliskan motivasi atau target kemampuan bahasa Arab Anda..."
            className="w-full p-3.5 rounded-xl bg-white border border-[#D4CBB4] text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#E2BE5B]" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Data Diri'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
