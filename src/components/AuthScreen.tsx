import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, MailPlus, Sparkles, UserPlus } from 'lucide-react';
import { api, setAuthToken } from '../api';
import { DESIGNER_EMAIL } from '../constants';
import type { User } from '../types';
import { EmblemLogo } from './EmblemLogo';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

type AuthStep = 'email' | 'password' | 'designer-setup' | 'register';

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [institution, setInstitution] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDesignerAccount, setIsDesignerAccount] = useState(false);
  const [foundStudentName, setFoundStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckEmail(e: FormEvent) {
    e.preventDefault();
    setError('');
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Masukkan alamat email terlebih dahulu.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.checkEmail(normalized);
      setEmail(normalized);
      if (res.role === 'designer') {
        setIsDesignerAccount(true);
        setStep(res.needsSetup ? 'designer-setup' : 'password');
      } else if (res.exists) {
        setIsDesignerAccount(false);
        setFoundStudentName(res.studentName || '');
        setStep('password');
      } else {
        setIsDesignerAccount(false);
        setStep('register');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memeriksa email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setAuthToken(res.token);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDesignerClaim(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.trim().length < 4) {
      setError('Kata sandi minimal 4 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.claimDesignerPassword(email, password);
      setAuthToken(res.token);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengatur sandi perancang.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Masukkan nama lengkap Anda.');
      return;
    }
    if (password.length < 4) {
      setError('Kata sandi minimal 4 karakter.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        email,
        name,
        password,
        region,
        institution,
      });
      setAuthToken(res.token);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun baru.');
    } finally {
      setLoading(false);
    }
  }

  function generateAppEmail() {
    const cleanBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12);
    const suffix = Math.floor(100 + Math.random() * 900);
    const prefix = cleanBase || 'pelajar';
    setEmail(`${prefix}.${suffix}@pelajar.ihyaularabiyyah.id`);
    setError('');
  }

  function resetToEmail() {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsDesignerAccount(false);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F9F5EB]">
      {/* Left Emerald Calligraphy Panel (matching reference screenshot) */}
      <aside className="relative overflow-hidden islamic-pattern-emerald text-[#F9F5EB] px-8 py-10 lg:px-14 lg:py-14 flex flex-col justify-between min-h-[280px] lg:min-h-screen border-b lg:border-b-0 lg:border-r border-[#C99A2E]/35">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] font-arabic text-4xl lg:text-5xl leading-[1.6] select-none overflow-hidden px-6 py-4 text-[#E2BE5B]"
        >
          مَن جَدَّ وَجَدَ وَمَن زَرَعَ حَصَدَ وَالْعِلْمُ نُورٌ يَهْدِي الْقُلُوبَ إِلَى الْحَقِّ وَالْهُدَىٰ
          اللُّغَةُ الْعَرَبِيَّةُ لُغَةُ الْقُرْآنِ وَالْحِكْمَةِ وَالْأَدَبِ وَالْبَيَانِ
          إِحْيَاءُ الْعَرَبِيَّةِ مَنْهَجٌ مُيَسَّرٌ لِطُلَّابِ الْعِلْمِ
        </div>

        <div className="relative z-10 flex items-center gap-3.5">
          <EmblemLogo sizeClass="w-12 h-12" />
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-[#F9F5EB]">
              Iḥyā’ul ‘Arabiyyah
            </p>
            <p className="text-xs text-[#E2BE5B]/90">Platform Pembelajaran Bahasa Arab</p>
          </div>
        </div>

        <div className="relative z-10 my-10 lg:my-0 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
          <p className="font-arabic text-5xl sm:text-6xl font-bold text-[#F9F5EB] drop-shadow-sm mb-4">
            العِلْمُ نُورٌ
          </p>
          <p className="text-sm sm:text-base text-[#E6ECE8] leading-relaxed">
            Ilmu itu cahaya. Masuk dengan email dan kata sandimu untuk melanjutkan belajar bahasa Arab,
            mengikuti ujian, dan meraih sertifikat resmi.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#C7D6CF] border-t border-[#C99A2E]/25 pt-4">
          <span>Dirancang oleh Ilman Alfarizi · UIN Mataram</span>
          <span>Sulawesi Tengah</span>
        </div>
      </aside>

      {/* Right Warm Ivory Authentication Panel */}
      <main className="islamic-pattern-ivory flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-[#FFFDF8] border border-[#C99A2E]/30 rounded-2xl shadow-sm p-7 sm:p-9">
          <div className="text-center mb-7">
            <div className="inline-flex justify-center mb-3 lg:hidden">
              <EmblemLogo sizeClass="w-14 h-14" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#142921] text-balance">
              {step === 'email' && 'Masuk ke Iḥyā’ul ‘Arabiyyah'}
              {step === 'password' && (isDesignerAccount ? 'Masuk Akun Perancang' : 'Masukkan Kata Sandi')}
              {step === 'designer-setup' && 'Aktifkan Sandi Perancang'}
              {step === 'register' && 'Buat Akun Belajar Baru'}
            </h1>
            <p className="mt-1.5 text-sm text-[#52675E]">
              {step === 'email' &&
                'Gunakan email pribadi atau buat email belajar baru langsung dari aplikasi.'}
              {step === 'password' &&
                (isDesignerAccount
                  ? `Akses pengelola khusus perancang (${DESIGNER_EMAIL})`
                  : `Selamat datang kembali${foundStudentName ? `, ${foundStudentName}` : ''}`)}
              {step === 'designer-setup' &&
                'Atur kata sandi rahasia perancang untuk pertama kali (misalnya frasa pilihan Anda seperti "pecinta kopi").'}
              {step === 'register' &&
                'Daftarkan email pribadi atau buat email baru khusus aplikasi jika lupa sandi email lama.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-[#FDF2F2] border border-[#DC2626]/30 px-4 py-3 text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-[#142921] mb-1.5">
                  Alamat Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#D4CBB4] text-[#142921] placeholder:text-[#8A9A92] focus:outline-none focus:ring-2 focus:ring-[#0B4334] focus:border-[#0B4334]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span>{loading ? 'Memeriksa...' : 'Lanjutkan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-[#E8E0CC] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('register');
                  }}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#F2ECDC] hover:bg-[#EAE1CA] text-[#142921] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MailPlus className="w-4 h-4 text-[#0B4334]" />
                  <span>Buat Email Baru di Aplikasi</span>
                </button>
                <p className="text-xs text-center text-[#52675E] leading-relaxed">
                  Jika lupa kata sandi email pribadi atau bermasalah, pelajar dapat langsung membuat email belajar baru di sini.
                </p>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="px-3.5 py-2.5 rounded-xl bg-[#F2ECDC]/70 border border-[#C99A2E]/25 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium text-[#142921]">{email}</span>
                <button
                  type="button"
                  onClick={resetToEmail}
                  className="text-xs font-semibold text-[#0B4334] hover:underline shrink-0 cursor-pointer"
                >
                  Ganti
                </button>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-[#142921] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi Anda"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-xl bg-white border border-[#D4CBB4] text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#52675E] hover:text-[#142921] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Memverifikasi...' : isDesignerAccount ? 'Masuk Dasbor Perancang' : 'Masuk Belajar'}
              </button>

              {!isDesignerAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setPassword('');
                    setError('');
                    setStep('register');
                  }}
                  className="w-full text-xs text-center text-[#0B4334] hover:underline py-1.5 cursor-pointer"
                >
                  Lupa sandi? Buat akun email baru di aplikasi
                </button>
              )}
            </form>
          )}

          {step === 'designer-setup' && (
            <form onSubmit={handleDesignerClaim} className="space-y-4">
              <div className="px-3.5 py-2.5 rounded-xl bg-[#0B4334]/10 border border-[#0B4334]/25 flex items-center gap-2.5 text-xs text-[#0B4334]">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Akun perancang terverifikasi: <strong>{email}</strong></span>
              </div>

              <div>
                <label htmlFor="claim-pass" className="block text-sm font-medium text-[#142921] mb-1.5">
                  Buat Kata Sandi Perancang
                </label>
                <input
                  id="claim-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contoh: pecinta kopi"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#D4CBB4] text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                />
              </div>

              <div>
                <label htmlFor="claim-confirm" className="block text-sm font-medium text-[#142921] mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  id="claim-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white border border-[#D4CBB4] text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#52675E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-[#D4CBB4]"
                />
                <span>Tampilkan kata sandi</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Sandi & Masuk Perancang'}
              </button>

              <button
                type="button"
                onClick={resetToEmail}
                className="w-full text-xs text-center text-[#52675E] hover:text-[#142921] py-1 cursor-pointer"
              >
                Kembali ke pilihan email
              </button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-medium text-[#142921] mb-1">
                  Nama Lengkap Pelajar
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Fauzan"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="reg-email" className="text-xs font-medium text-[#142921]">
                    Email Akun
                  </label>
                  <button
                    type="button"
                    onClick={generateAppEmail}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4334] hover:underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C99A2E]" />
                    <span>Buat Email Otomatis</span>
                  </button>
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com atau klik Buat Email Otomatis"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-region" className="block text-xs font-medium text-[#142921] mb-1">
                    Asal Daerah
                  </label>
                  <input
                    id="reg-region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Contoh: Mataram"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-inst" className="block text-xs font-medium text-[#142921] mb-1">
                    Sekolah / Kampus
                  </label>
                  <input
                    id="reg-inst"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Opsional"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-xs font-medium text-[#142921] mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D4CBB4] text-sm text-[#142921] focus:outline-none focus:ring-2 focus:ring-[#0B4334]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#0B4334] hover:bg-[#083327] text-[#F9F5EB] font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Mendaftarkan...' : 'Daftar & Mulai Belajar'}</span>
              </button>

              <button
                type="button"
                onClick={resetToEmail}
                className="w-full text-xs text-center text-[#52675E] hover:text-[#142921] py-1 cursor-pointer"
              >
                Sudah punya akun? Masuk di sini
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
