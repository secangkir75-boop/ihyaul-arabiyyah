import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  Certificate,
  ContentItem,
  DesignerInfo,
  ExamAttempt,
  ExamQuestion,
  Message,
  Predikat,
  Submission,
  User,
} from '../src/types';

export const DESIGNER_EMAIL = 'secangkir75@gmail.com';

export const DESIGNER_PROFILE: DesignerInfo = {
  name: 'Ilman Alfarizi',
  birthPlaceDate: 'Tentena, 06 Oktober 2005',
  region: 'Sulawesi Tengah',
  university: 'UIN Mataram',
  nim: '240102065',
  phone: '082283514946',
  email: DESIGNER_EMAIL,
  roleTitle: 'Perancang & Pengembang Aplikasi Iḥyā’ul ‘Arabiyyah',
  vision:
    'Menghidupkan kembali kecintaan dan ketekunan belajar bahasa Arab bagi pelajar di Indonesia melalui materi terstruktur, latihan aktif, dan bimbingan langsung.',
};

interface StoredUser extends User {
  passwordHash: string;
}

interface StoredExamQuestion extends ExamQuestion {
  correctIndex: number;
}

interface DatabaseSchema {
  designerPasswordHash: string | null;
  users: StoredUser[];
  contents: ContentItem[];
  progressByUser: Record<string, string[]>;
  submissions: Submission[];
  examQuestions: StoredExamQuestion[];
  examAttempts: ExamAttempt[];
  certificates: Certificate[];
  messages: Message[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ihya_db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function computePredikat(score: number): {
  predikat: Predikat;
  arabicPredikat: string;
} {
  if (score >= 90) {
    return { predikat: 'Mumtāz', arabicPredikat: 'مُمْتَاز' };
  }
  if (score >= 80) {
    return { predikat: 'Jayyid Jiddan', arabicPredikat: 'جَيِّد جِدًّا' };
  }
  if (score >= 70) {
    return { predikat: 'Jayyid', arabicPredikat: 'جَيِّد' };
  }
  if (score >= 60) {
    return { predikat: 'Maqbūl', arabicPredikat: 'مَقْبُول' };
  }
  return { predikat: 'Perlu Penguatan', arabicPredikat: 'يَحْتَاجُ إِلَى التَّقْوِيَة' };
}

function buildSeedDatabase(): DatabaseSchema {
  const now = new Date().toISOString();

  const designerUser: StoredUser = {
    id: 'designer-ilman',
    email: DESIGNER_EMAIL,
    name: 'Ilman Alfarizi',
    role: 'designer',
    birthPlaceDate: 'Tentena, 06 Oktober 2005',
    region: 'Sulawesi Tengah',
    institution: 'UIN Mataram',
    phone: '082283514946',
    bio: 'Mahasiswa UIN Mataram (NIM 240102065) · Perancang Iḥyā’ul ‘Arabiyyah',
    createdAt: now,
    passwordHash: '',
  };

  const contents: ContentItem[] = [
    // 1. Materi
    {
      id: 'mat-1',
      moduleId: 'materi',
      title: 'Pembagian Kata dalam Bahasa Arab (Al-Kalimah)',
      arabicTitle: 'أَقْسَامُ الْكَلِمَةِ',
      level: 'Dasar',
      summary: 'Mengenal tiga unsur utama pembentuk kalimat Arab: Isim, Fi’il, dan Harf beserta tanda-tandanya.',
      arabicText: 'الْكَلِمَةُ ثَلَاثَةُ أَقْسَامٍ: اِسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى.',
      translation: 'Kata terbagi menjadi tiga bagian: Isim (kata benda/sifat), Fi’il (kata kerja), dan Harf (kata penghubung yang memiliki makna).',
      explanation:
        '1. Isim (الاسم): Kata yang menunjukkan makna mandiri tanpa terikat waktu. Tandanya menerima tanwin, awalan ال (Alif Lam), atau didahului huruf jar.\n2. Fi’il (الفعل): Kata kerja yang terikat waktu (Madhi = lampau, Mudhari’ = sedang/akan datang, Amr = perintah).\n3. Harf (الحرف): Kata tugas seperti فِي (di), إِلَى (ke), مِنْ (dari), عَلَى (di atas).',
      vocabulary: [
        { arabic: 'اِسْمٌ', transliteration: 'ismun', meaning: 'Kata benda / nama / sifat' },
        { arabic: 'فِعْلٌ', transliteration: 'fi‘lun', meaning: 'Kata kerja' },
        { arabic: 'حَرْفٌ', transliteration: 'ḥarfun', meaning: 'Kata depan / partikel' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mat-2',
      moduleId: 'materi',
      title: 'Isim Mudzakkar & Mu’annats',
      arabicTitle: 'الْمُذَكَّرُ وَالْمُؤَنَّثُ',
      level: 'Dasar',
      summary: 'Membedakan kata benda maskulin dan feminin agar tepat saat menyusun kalimat dan kata sifat.',
      arabicText: 'الطَّالِبُ مُجْتَهِدٌ وَالطَّالِبَةُ مُجْتَهِدَةٌ.',
      translation: 'Pelajar laki-laki itu bersungguh-sungguh dan pelajar perempuan itu bersungguh-sungguh.',
      explanation:
        'Secara umum, Isim Mu’annats ditandai dengan Ta’ Marbuthah (ة) di akhir kata seperti مَدْرَسَةٌ (sekolah) atau طَالِبَةٌ (siswi). Namun ada pula Mu’annats Ma’nawi seperti أُمٌّ (ibu) dan شَمْسٌ (matahari).',
      vocabulary: [
        { arabic: 'مُذَكَّرٌ', transliteration: 'mudzakkar', meaning: 'Maskulin (laki-laki)' },
        { arabic: 'مُؤَنَّثٌ', transliteration: 'mu’annats', meaning: 'Feminin (perempuan)' },
        { arabic: 'مُجْتَهِدٌ', transliteration: 'mujtahidun', meaning: 'Bersungguh-sungguh / rajin' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mat-3',
      moduleId: 'materi',
      title: 'Tashrif Fi’il Madhi & Mudhari’ Dasar',
      arabicTitle: 'تَصْرِيفُ الْفِعْلِ الْمَاضِي وَالْمُضَارِعِ',
      level: 'Menengah',
      summary: 'Perubahan bentuk kata kerja lampau dan sedang berlangsung sesuai dhamir (kata ganti).',
      arabicText: 'كَتَبَ الطَّالِبُ الدَّرْسَ — يَكْتُبُ الطَّالِبُ الدَّرْسَ.',
      translation: 'Pelajar itu telah menulis pelajaran — Pelajar itu sedang menulis pelajaran.',
      explanation:
        'Fi’il Madhi menunjukkan perbuatan yang telah selesai, sedangkan Fi’il Mudhari’ diawali huruf mudhara’ah (أ، ن، ي، ت) untuk menunjukkan aktivitas yang sedang atau akan dikerjakan.',
      vocabulary: [
        { arabic: 'كَتَبَ - يَكْتُبُ', transliteration: 'kataba - yaktubu', meaning: 'Menulis' },
        { arabic: 'قَرَأَ - يَقْرَأُ', transliteration: 'qara’a - yaqra’u', meaning: 'Membaca' },
        { arabic: 'فَهِمَ - يَفْهَمُ', transliteration: 'fahima - yafhamu', meaning: 'Memahami' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 2. Video
    {
      id: 'vid-1',
      moduleId: 'video',
      title: 'Pengantar Ilmu Nahwu untuk Pemula',
      arabicTitle: 'مُقَدِّمَةٌ فِي عِلْمِ النَّحْوِ',
      level: 'Dasar',
      summary: 'Penjelasan ringkas fungsi harakat akhir (I’rab) dalam menentukan kedudukan kata bahasa Arab.',
      arabicText: 'النَّحْوُ مِيزَانُ الْكَلَامِ الْعَرَبِيِّ.',
      translation: 'Ilmu Nahwu adalah neraca/penimbang ketepatan ujaran bahasa Arab.',
      explanation:
        'Perancang dapat mengganti tautan video ini atau mengunggah file video MP4 langsung dari Android/laptop melalui menu Kelola Konten.',
      mediaType: 'link',
      mediaUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      mediaKind: 'video',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vid-2',
      moduleId: 'video',
      title: 'Makharijul Huruf & Artikulasi Bahasa Arab Fasih',
      arabicTitle: 'مَخَارِجُ الْحُرُوفِ الْعَرَبِيَّةِ',
      level: 'Dasar',
      summary: 'Panduan pelafalan huruf-huruf hijaiyah yang mirip seperti ح / هـ dan ع / أ.',
      arabicText: 'اَللُّغَةُ الْعَرَبِيَّةُ لُغَةُ الضَّادِ.',
      translation: 'Bahasa Arab adalah bahasa huruf Dhad.',
      explanation: 'Simak contoh artikulasi huruf dari tenggorokan (halq) dan ujung lidah agar bacaan semakin fasih.',
      mediaType: 'none',
      mediaKind: 'video',
      createdAt: now,
      updatedAt: now,
    },
    // 3. Cerita
    {
      id: 'cer-1',
      moduleId: 'cerita',
      title: 'Ketekunan Penuntut Ilmu (Al-‘Ilmu Nūr)',
      arabicTitle: 'مُثَابَرَةُ طَالِبِ الْعِلْمِ',
      level: 'Dasar',
      summary: 'Kisah pendek berharakat lengkap tentang seorang pelajar yang menjaga hafalan dan percakapan Arabnya setiap pagi.',
      arabicText:
        'فِي صَبَاحٍ جَمِيلٍ، ذَهَبَ أَحْمَدُ إِلَى الْمَكْتَبَةِ قَبْلَ طُلُوعِ الشَّمْسِ. قَرَأَ كِتَابًا فِي اللُّغَةِ الْعَرَبِيَّةِ وَدَوَّنَ الْمُفْرَدَاتِ الْجَدِيدَةَ فِي دَفْتَرِهِ. قَالَ لَهُ أُسْتَاذُهُ: مَنْ جَدَّ وَجَدَ، وَمَنْ صَبَرَ ظَفِرَ.',
      translation:
        'Pada suatu pagi yang indah, Ahmad pergi ke perpustakaan sebelum matahari terbit. Ia membaca sebuah kitab bahasa Arab dan mencatat kosakata baru di buku catatannya. Gurunya berkata kepadanya: Barang siapa bersungguh-sungguh ia akan mendapatkannya, dan barang siapa bersabar ia akan beruntung.',
      explanation: 'Perhatikan penggunaan huruf jar (فِي، إِلَى) yang menjadikan isim setelahnya berharakat kasrah.',
      vocabulary: [
        { arabic: 'الْمَكْتَبَةُ', transliteration: 'al-maktabah', meaning: 'Perpustakaan' },
        { arabic: 'دَوَّنَ', transliteration: 'dawwana', meaning: 'Mencatat' },
        { arabic: 'مَنْ جَدَّ وَجَدَ', transliteration: 'man jadda wajada', meaning: 'Siapa bersungguh-sungguh pasti berhasil' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cer-2',
      moduleId: 'cerita',
      title: 'Secangkir Kopi dan Kitab Klasik',
      arabicTitle: 'فِنْجَانُ قَهْوَةٍ وَكِتَابٌ',
      level: 'Menengah',
      summary: 'Kisah reflektif tentang ketenangan menelaah teks Arab di malam hari.',
      arabicText:
        'جَلَسَ عُمَرُ فِي غُرْفَتِهِ الْهَادِئَةِ، وَأَعَدَّ فِنْجَانًا مِنَ الْقَهْوَةِ الدَّافِئَةِ. فَتَحَ كِتَابَ الْأَدَبِ الْعَرَبِيِّ، فَوَجَدَ فِيهِ حِكْمَةً بَلِيغَةً: لَا تَحْسَبِ الْمَجْدَ تَمْرًا أَنْتَ آكِلُهُ، لَنْ تَبْلُغَ الْمَجْدَ حَتَّى تَلْعَقَ الصَّبِرَا.',
      translation:
        'Umar duduk di ruangannya yang tenang, lalu menyiapkan secangkir kopi hangat. Ia membuka kitab sastra Arab dan menemukan hikmah mendalam di dalamnya: Jangan kau kira kemuliaan itu semudah kurma yang kau makan; engkau tak akan meraih kemuliaan hingga mengecap pahitnya kesabaran.',
      explanation: 'Kisah ini melatih pemahaman Fi’il Madhi beruntun (جَلَسَ، أَعَدَّ، فَتَحَ، وَجَدَ) dan gaya bahasa sastra.',
      vocabulary: [
        { arabic: 'فِنْجَانُ قَهْوَةٍ', transliteration: 'finjānu qahwatin', meaning: 'Secangkir kopi' },
        { arabic: 'حِكْمَةٌ بَلِيغَةٌ', transliteration: 'ḥikmatun balīghah', meaning: 'Hikmah yang mendalam' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 4. Menulis
    {
      id: 'men-1',
      moduleId: 'menulis',
      title: 'Latihan Insya’ Muwajjah: Perkenalan Diri',
      arabicTitle: 'الْكِتَابَةُ: التَّعْرِيفُ بِالنَّفْسِ',
      level: 'Dasar',
      summary: 'Menyusun paragraf singkat bahasa Arab tentang nama, asal daerah, dan tujuan belajar bahasa Arab.',
      arabicText: 'اِسْمِي ...، أَنَا مِنْ ...، أَتَعَلَّمُ اللُّغَةَ الْعَرَبِيَّةَ لِأَنَّهَا لُغَةُ الْقُرْآنِ وَالْعِلْمِ.',
      translation: 'Namaku ..., saya berasal dari ..., saya belajar bahasa Arab karena ia adalah bahasa Al-Qur’an dan ilmu.',
      promptTask:
        'Tuliskan 3 sampai 5 kalimat bahasa Arab yang memperkenalkan diri Anda (nama, asal daerah, status pelajar/mahasiswa, dan alasan menyukai bahasa Arab), lalu kirimkan untuk diperiksa perancang.',
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 5. Mendengar (Istima')
    {
      id: 'ist-1',
      moduleId: 'mendengar',
      title: 'Istima’: Percakapan Pagi di Asrama',
      arabicTitle: 'الِاسْتِمَاعُ: حِوَارُ الصَّبَاحِ',
      level: 'Dasar',
      summary: 'Dengarkan audio atau pelafalan Arab berikut dan pahami dialog antara dua sahabat di pagi hari.',
      arabicText:
        'خَالِدٌ: السَّلَامُ عَلَيْكُمْ يَا سَالِمُ، كَيْفَ أَصْبَحْتَ؟\nسَالِمٌ: وَعَلَيْكُمُ السَّلَامُ، أَصْبَحْتُ بِخَيْرٍ وَالْحَمْدُ لِلَّهِ. هَلْ أَنْتَ مُسْتَعِدٌّ لِدَرْسِ الْعَرَبِيَّةِ الْيَوْمَ؟\nخَالِدٌ: نَعَمْ، أَنَا مُسْتَعِدٌّ جِدًّا!',
      translation:
        'Khalid: Assalamu’alaikum wahai Salim, bagaimana kabarmu pagi ini?\nSalim: Wa’alaikumussalam, alhamdulillah aku baik-baik saja. Apakah kamu siap untuk pelajaran bahasa Arab hari ini?\nKhalid: Ya, saya sangat siap!',
      explanation:
        'Gunakan tombol Putar Suara Arab untuk melatih telinga Anda, atau putar rekaman audio yang diunggah oleh perancang.',
      mediaType: 'none',
      mediaKind: 'audio',
      createdAt: now,
      updatedAt: now,
    },
    // 6. Menganalisis
    {
      id: 'ana-1',
      moduleId: 'menganalisis',
      title: 'Analisis I’rab Jumlah Fi’liyyah',
      arabicTitle: 'تَحْلِيلُ الْجُمْلَةِ الْفِعْلِيَّةِ',
      level: 'Menengah',
      summary: 'Menguraikan kedudukan Fi’il, Fa’il (subjek), dan Maf’ul Bih (objek) beserta tanda harakat akhirnya.',
      arabicText: 'يَقْرَأُ التِّلْمِيذُ الْقُرْآنَ فِي الْمَسْجِدِ.',
      translation: 'Murid itu membaca Al-Qur’an di dalam masjid.',
      explanation:
        '• يَقْرَأُ: Fi’il Mudhari’ Marfu’ dengan dhammah.\n• التِّلْمِيذُ: Fa’il (pelaku) Marfu’ dengan dhammah.\n• الْقُرْآنَ: Maf’ul Bih (objek) Manshub dengan fathah.\n• فِي الْمَسْجِدِ: Jar dan Majrur (kasrah).',
      promptTask:
        'Analisislah kedudukan (I’rab) setiap kata pada kalimat: «كَتَبَ الْمُدَرِّسُ الدَّرْسَ عَلَى السَّبُّورَةِ» (Guru menulis pelajaran di papan tulis).',
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 7. Menerjemah
    {
      id: 'ter-1',
      moduleId: 'menerjemah',
      title: 'Terjemah Teks Kontekstual: Cinta Ilmu',
      arabicTitle: 'التَّرْجَمَةُ: حُبُّ الْعِلْمِ',
      level: 'Menengah',
      summary: 'Melatih penerjemahan bermakna (tarjamah ma’nawiyyah) dari teks Arab ke bahasa Indonesia yang baik dan benar.',
      arabicText: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ، وَالْمُدَاوَمَةُ عَلَى الْمُطَالَعَةِ تَزِيدُ الْفَهْمَ وَتُحْيِي اللُّغَةَ فِي الْقَلْبِ.',
      translation:
        'Menuntut ilmu adalah sebuah kewajiban, dan ketekunan dalam menelaah bacaan akan menambah pemahaman serta menghidupkan bahasa di dalam hati.',
      vocabulary: [
        { arabic: 'الْمُدَاوَمَةُ', transliteration: 'al-mudāwamah', meaning: 'Ketekunan / konsistensi' },
        { arabic: 'الْمُطَالَعَةُ', transliteration: 'al-muṭāla‘ah', meaning: 'Membaca / menelaah' },
        { arabic: 'تُحْيِي', transliteration: 'tuḥyī', meaning: 'Menghidupkan' },
      ],
      promptTask:
        'Terjemahkan kalimat berikut ke dalam bahasa Arab yang fasih: "Saya mencintai bahasa Arab dan berlatih berbicara setiap hari bersama teman-temanku."',
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 8. Ungkapan Sehari-hari
    {
      id: 'ung-1',
      moduleId: 'ungkapan',
      title: 'Ungkapan Salam, Syukur & Sopan Santun Harian',
      arabicTitle: 'التَّعْبِيرَاتُ الْيَوْمِيَّةُ',
      level: 'Dasar',
      summary: 'Kumpulan ungkapan praktis yang paling sering dipakai dalam percakapan harian santri dan mahasiswa.',
      arabicText: 'جَزَاكَ اللَّهُ خَيْرًا — عَفْوًا — تَفَضَّلْ — عَلَى الرَّحْبِ وَالسَّعَةِ — بِالتَّوْفِيقِ.',
      translation:
        'Semoga Allah membalasmu dengan kebaikan — Sama-sama / maaf — Silakan — Dengan senang hati — Semoga sukses.',
      vocabulary: [
        { arabic: 'جَزَاكَ اللَّهُ خَيْرًا', transliteration: 'Jazākallāhu khairan', meaning: 'Terima kasih (semoga Allah membalas kebaikanmu)' },
        { arabic: 'تَفَضَّلْ', transliteration: 'Tafaḍḍal', meaning: 'Silakan (untuk laki-laki)' },
        { arabic: 'عَلَى الرَّحْبِ وَالسَّعَةِ', transliteration: '‘Alar-raḥbi was-sa‘ah', meaning: 'Dengan senang hati' },
        { arabic: 'بِالتَّوْفِيقِ وَالنَّجَاحِ', transliteration: 'Bit-taufīqi wan-najāḥ', meaning: 'Semoga berhasil dan sukses' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
    // 9. Pola Penyusunan Kalimat
    {
      id: 'pol-1',
      moduleId: 'pola',
      title: 'Pola Jumlah Ismiyyah (Mubtada’ + Khabar)',
      arabicTitle: 'تَرْكِيبُ الْجُمْلَةِ الِاسْمِيَّةِ',
      level: 'Dasar',
      summary: 'Rumus dasar menyusun kalimat nominal Arab yang diawali kata benda dan penjelasannya.',
      arabicText: '[الْمُبْتَدَأُ (مَعْرِفَةٌ + مَرْفُوعٌ)] + [الْخَبَرُ (نَكِرَةٌ + مَرْفُوعٌ)] = الْعِلْمُ نُورٌ.',
      translation: 'Pola: Subjek (Ma’rifah/ber-Alif Lam + Dhammah) + Predikat (Nakirah + Tanwin Dhammah) = Ilmu itu cahaya.',
      explanation:
        'Syarat kesesuaian: Mubtada’ dan Khabar harus selaras dalam jenis (Mudzakkar/Mu’annats) dan jumlah (Mufrad/Mutsanna/Jamak). Contoh: الْمَدْرَسَةُ كَبِيرَةٌ (Sekolah itu besar).',
      vocabulary: [
        { arabic: 'الْعِلْمُ نُورٌ', transliteration: 'al-‘ilmu nūrun', meaning: 'Ilmu itu cahaya' },
        { arabic: 'الْبَيْتُ جَمِيلٌ', transliteration: 'al-baitu jamīlun', meaning: 'Rumah itu indah' },
        { arabic: 'الْمَكْتَبَةُ وَاسِعَةٌ', transliteration: 'al-maktabatu wāsi‘atun', meaning: 'Perpustakaan itu luas' },
      ],
      mediaType: 'none',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const examQuestions: StoredExamQuestion[] = [
    {
      id: 'q-1',
      question: 'Dalam pembagian kata bahasa Arab (Al-Kalimah), kata yang menunjukkan kata kerja dan terikat oleh waktu disebut...',
      arabicPrompt: 'مَا هُوَ الْقِسْمُ الَّذِي يَدُلُّ عَلَى حَدَثٍ مُقْتَرِنٍ بِزَمَنٍ؟',
      options: ['Isim (الاسم)', 'Fi’il (الفعل)', 'Harf (الحرف)', 'Dhamir (الضمير)'],
      correctIndex: 1,
      explanation: 'Fi’il adalah kata kerja yang selalu terikat dengan waktu (Madhi, Mudhari’, atau Amr).',
      points: 10,
    },
    {
      id: 'q-2',
      question: 'Manakah di antara kata berikut yang termasuk Isim Mu’annats (feminin) karena memiliki Ta’ Marbuthah?',
      arabicPrompt: 'أَيُّ كَلِمَةٍ تَدُلُّ عَلَى الْمُؤَنَّثِ؟',
      options: ['كِتَابٌ', 'قَلَمٌ', 'مَدْرَسَةٌ', 'مَسْجِدٌ'],
      correctIndex: 2,
      explanation: 'مَدْرَسَةٌ (madrasah/sekolah) diakhiri Ta’ Marbuthah (ة) yang merupakan tanda isim mu’annats.',
      points: 10,
    },
    {
      id: 'q-3',
      question: 'Pada kalimat «يَقْرَأُ الطَّالِبُ الْكِتَابَ», apakah kedudukan kata «الطَّالِبُ»?',
      arabicPrompt: 'يَقْرَأُ الطَّالِبُ الْكِتَابَ',
      options: ['Mubtada’ (مبتدأ)', 'Khabar (خبر)', 'Fa’il (فاعل)', 'Maf’ul Bih (مفعول به)'],
      correctIndex: 2,
      explanation: 'الطَّالِبُ adalah pelaku pekerjaan membaca sehingga kedudukannya adalah Fa’il (Marfu’ dengan dhammah).',
      points: 10,
    },
    {
      id: 'q-4',
      question: 'Apakah harakat akhir yang tepat untuk kata «الْمَسْجِدِ» pada kalimat «ذَهَبْتُ إِلَى الْمَسْجِدِ»?',
      arabicPrompt: 'ذَهَبْتُ إِلَى الْمَسْجِدِ',
      options: ['Dhammah (ـُ)', 'Fathah (ـَ)', 'Kasrah (ـِ)', 'Sukun (ـْ)'],
      correctIndex: 2,
      explanation: 'Karena didahului huruf jar «إِلَى», maka isim setelahnya menjadi Majrur dengan tanda kasrah.',
      points: 10,
    },
    {
      id: 'q-5',
      question: 'Apakah arti ungkapan sehari-hari «عَلَى الرَّحْبِ وَالسَّعَةِ»?',
      arabicPrompt: 'عَلَى الرَّحْبِ وَالسَّعَةِ',
      options: ['Sampai jumpa besok', 'Dengan senang hati', 'Mohon tunggu sebentar', 'Selamat pagi'],
      correctIndex: 1,
      explanation: 'Ungkapan ini digunakan untuk menjawab ucapan terima kasih atau menyambut tamu dengan hangat ("Dengan senang hati").',
      points: 10,
    },
    {
      id: 'q-6',
      question: 'Manakah susunan Jumlah Ismiyyah (Mubtada’ + Khabar) yang tepat secara kaidah?',
      arabicPrompt: 'اِخْتَرِ الْجُمْلَةَ الِاسْمِيَّةَ الصَّحِيحَةَ:',
      options: [
        'الْمَدْرَسَةُ كَبِيرٌ',
        'الْمَدْرَسَةُ كَبِيرَةٌ',
        'مَدْرَسَةٌ الْكَبِيرَةُ',
        'الْمَدْرَسَةِ كَبِيرَةً',
      ],
      correctIndex: 1,
      explanation: 'Mubtada’ (الْمَدْرَسَةُ) mu’annats dan ma’rifah marfu’, maka khabarnya (كَبِيرَةٌ) juga mu’annats, nakirah, dan marfu’.',
      points: 10,
    },
    {
      id: 'q-7',
      question: 'Bentuk Fi’il Mudhari’ (kata kerja sedang/akan) dari kata «كَتَبَ» (telah menulis) untuk kata ganti «هُوَ» adalah...',
      arabicPrompt: 'مَا هُوَ الْفِعْلُ الْمُضَارِعُ مِنْ «كَتَبَ»؟',
      options: ['يَكْتُبُ', 'اُكْتُبْ', 'كَاتِبٌ', 'مَكْتُوبٌ'],
      correctIndex: 0,
      explanation: 'يَكْتُبُ (yaktubu) diawali ya’ mudhara’ah dan berarti "dia (lk) sedang/akan menulis".',
      points: 10,
    },
    {
      id: 'q-8',
      question: 'Apakah makna ungkapan hikmah «مَنْ جَدَّ وَجَدَ»?',
      arabicPrompt: 'مَنْ جَدَّ وَجَدَ',
      options: [
        'Ilmu adalah cahaya kehidupan',
        'Barang siapa bersungguh-sungguh, ia akan mendapatkan hasil',
        'Kebersihan adalah sebagian dari iman',
        'Waktu lebih berharga daripada emas',
      ],
      correctIndex: 1,
      explanation: 'Pepatah Arab klasik ini mengajarkan pentingnya kesungguhan (jidd) untuk mencapai keberhasilan.',
      points: 10,
    },
  ];

  return {
    designerPasswordHash: null,
    users: [designerUser],
    contents,
    progressByUser: {},
    submissions: [],
    examQuestions,
    examAttempts: [],
    certificates: [],
    messages: [],
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw) as DatabaseSchema;
      } catch {
        this.data = buildSeedDatabase();
        this.save();
      }
    } else {
      this.data = buildSeedDatabase();
      this.save();
    }
  }

  private save() {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public getDesignerNeedsSetup(): boolean {
    const envPass = process.env.DESIGNER_PASSCODE;
    if (envPass && envPass.trim().length > 0) {
      return false;
    }
    return !this.data.designerPasswordHash;
  }

  public claimDesignerPassword(password: string): User {
    if (!this.getDesignerNeedsSetup()) {
      throw new Error('Kata sandi perancang sudah diatur.');
    }
    this.data.designerPasswordHash = hashPassword(password);
    this.save();
    return this.getDesignerUser();
  }

  public verifyDesignerPassword(password: string): boolean {
    const envPass = process.env.DESIGNER_PASSCODE;
    if (envPass && envPass.trim().length > 0) {
      const a = Buffer.from(password, 'utf-8');
      const b = Buffer.from(envPass.trim(), 'utf-8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
    if (!this.data.designerPasswordHash) return false;
    return verifyPassword(password, this.data.designerPasswordHash);
  }

  public getDesignerUser(): User {
    const found = this.data.users.find((u) => u.email === DESIGNER_EMAIL);
    if (!found) {
      throw new Error('Akun perancang tidak ditemukan.');
    }
    const { passwordHash: _ph, ...safe } = found;
    return safe;
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    const norm = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === norm);
  }

  public findUserById(id: string): User | undefined {
    const found = this.data.users.find((u) => u.id === id);
    if (!found) return undefined;
    const { passwordHash: _ph, ...safe } = found;
    return safe;
  }

  public createStudent(input: {
    email: string;
    name: string;
    password: string;
    region?: string;
    institution?: string;
    phone?: string;
  }): User {
    const normEmail = input.email.trim().toLowerCase();
    if (normEmail === DESIGNER_EMAIL) {
      throw new Error('Email ini khusus milik perancang aplikasi.');
    }
    if (this.findUserByEmail(normEmail)) {
      throw new Error('Email sudah terdaftar. Silakan masuk dengan kata sandi atau buat email baru.');
    }
    const user: StoredUser = {
      id: `stu-${crypto.randomUUID()}`,
      email: normEmail,
      name: input.name.trim(),
      role: 'student',
      region: input.region?.trim() || '',
      institution: input.institution?.trim() || '',
      phone: input.phone?.trim() || '',
      bio: '',
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password),
    };
    this.data.users.push(user);
    this.save();
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }

  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'birthPlaceDate' | 'region' | 'institution' | 'phone' | 'bio'>>
  ): User {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('Pengguna tidak ditemukan.');
    const current = this.data.users[idx];
    this.data.users[idx] = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() || current.name : current.name,
      birthPlaceDate: updates.birthPlaceDate !== undefined ? updates.birthPlaceDate.trim() : current.birthPlaceDate,
      region: updates.region !== undefined ? updates.region.trim() : current.region,
      institution: updates.institution !== undefined ? updates.institution.trim() : current.institution,
      phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
      bio: updates.bio !== undefined ? updates.bio.trim() : current.bio,
    };
    this.save();
    const { passwordHash: _ph, ...safe } = this.data.users[idx];
    return safe;
  }

  public listStudents() {
    const students = this.data.users.filter((u) => u.role === 'student');
    const totalContents = this.data.contents.length;
    return students.map((s) => {
      const { passwordHash: _ph, ...safeUser } = s;
      const completed = this.data.progressByUser[s.id]?.length ?? 0;
      const attempts = this.data.examAttempts
        .filter((a) => a.userId === s.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const certs = this.data.certificates
        .filter((c) => c.userId === s.id)
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
      return {
        user: safeUser,
        completedCount: completed,
        totalContents,
        latestAttempt: attempts[0],
        certificate: certs[0],
      };
    });
  }

  public getContents(): ContentItem[] {
    return this.data.contents;
  }

  public createContent(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): ContentItem {
    const now = new Date().toISOString();
    const created: ContentItem = {
      ...item,
      id: `cnt-${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.data.contents.unshift(created);
    this.save();
    return created;
  }

  public updateContent(id: string, patch: Partial<ContentItem>): ContentItem {
    const idx = this.data.contents.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Konten tidak ditemukan.');
    this.data.contents[idx] = {
      ...this.data.contents[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.contents[idx];
  }

  public deleteContent(id: string): void {
    this.data.contents = this.data.contents.filter((c) => c.id !== id);
    this.save();
  }

  public getUserProgress(userId: string): string[] {
    return this.data.progressByUser[userId] || [];
  }

  public toggleUserProgress(userId: string, contentId: string): string[] {
    const current = new Set(this.data.progressByUser[userId] || []);
    if (current.has(contentId)) {
      current.delete(contentId);
    } else {
      current.add(contentId);
    }
    const arr = Array.from(current);
    this.data.progressByUser[userId] = arr;
    this.save();
    return arr;
  }

  public getSubmissions(userId?: string): Submission[] {
    if (!userId) return this.data.submissions;
    return this.data.submissions.filter((s) => s.userId === userId);
  }

  public createSubmission(input: Omit<Submission, 'id' | 'status' | 'createdAt'>): Submission {
    const item: Submission = {
      ...input,
      id: `sub-${crypto.randomUUID()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.submissions.unshift(item);
    this.save();
    return item;
  }

  public reviewSubmission(id: string, feedback: string, score?: number): Submission {
    const idx = this.data.submissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Kiriman latihan tidak ditemukan.');
    this.data.submissions[idx] = {
      ...this.data.submissions[idx],
      designerFeedback: feedback,
      score,
      status: 'reviewed',
    };
    this.save();
    return this.data.submissions[idx];
  }

  public getExamQuestions(includeAnswers: boolean): ExamQuestion[] {
    if (includeAnswers) return this.data.examQuestions;
    return this.data.examQuestions.map(({ correctIndex: _c, explanation: _e, ...q }) => q);
  }

  public createExamQuestion(q: Omit<StoredExamQuestion, 'id'>): StoredExamQuestion {
    const item: StoredExamQuestion = {
      ...q,
      id: `q-${crypto.randomUUID()}`,
    };
    this.data.examQuestions.push(item);
    this.save();
    return item;
  }

  public updateExamQuestion(id: string, patch: Partial<StoredExamQuestion>): StoredExamQuestion {
    const idx = this.data.examQuestions.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('Soal ujian tidak ditemukan.');
    this.data.examQuestions[idx] = {
      ...this.data.examQuestions[idx],
      ...patch,
      id,
    };
    this.save();
    return this.data.examQuestions[idx];
  }

  public deleteExamQuestion(id: string): void {
    this.data.examQuestions = this.data.examQuestions.filter((q) => q.id !== id);
    this.save();
  }

  public gradeAndSaveExam(user: User, answers: number[]): {
    attempt: ExamAttempt;
    details: Array<{ questionId: string; correctIndex: number; chosenIndex: number; isCorrect: boolean; explanation?: string }>;
  } {
    const questions = this.data.examQuestions;
    if (questions.length === 0) {
      throw new Error('Belum ada soal ujian yang tersedia.');
    }
    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;
    const details = questions.map((q, idx) => {
      const chosen = typeof answers[idx] === 'number' ? answers[idx] : -1;
      const isCorrect = chosen === q.correctIndex;
      totalPoints += q.points || 10;
      if (isCorrect) {
        earnedPoints += q.points || 10;
        correctCount += 1;
      }
      return {
        questionId: q.id,
        correctIndex: q.correctIndex,
        chosenIndex: chosen,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const { predikat } = computePredikat(score);

    const attempt: ExamAttempt = {
      id: `att-${crypto.randomUUID()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      score,
      totalQuestions: questions.length,
      correctCount,
      predikat,
      answers,
      createdAt: new Date().toISOString(),
    };
    this.data.examAttempts.unshift(attempt);
    this.save();
    return { attempt, details };
  }

  public getExamAttempts(userId?: string): ExamAttempt[] {
    if (!userId) return this.data.examAttempts;
    return this.data.examAttempts.filter((a) => a.userId === userId);
  }

  public getCertificates(userId?: string): Certificate[] {
    if (!userId) return this.data.certificates;
    return this.data.certificates.filter((c) => c.userId === userId);
  }

  public issueCertificate(attemptId: string, note?: string): Certificate {
    const attempt = this.data.examAttempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Hasil ujian tidak ditemukan.');
    if (attempt.score < 60) {
      throw new Error('Nilai minimal untuk penerbitan sertifikat adalah 60 (Predikat Maqbūl).');
    }
    const existing = this.data.certificates.find((c) => c.attemptId === attemptId);
    if (existing) {
      if (note !== undefined) {
        existing.note = note.trim();
        this.save();
      }
      return existing;
    }

    const { predikat, arabicPredikat } = computePredikat(attempt.score);
    const serial = String(this.data.certificates.length + 1).padStart(4, '0');
    const year = new Date().getFullYear();
    const cert: Certificate = {
      id: `cert-${crypto.randomUUID()}`,
      attemptId,
      userId: attempt.userId,
      userName: attempt.userName,
      userEmail: attempt.userEmail,
      score: attempt.score,
      predikat,
      arabicPredikat,
      certificateNumber: `IHYA/${year}/${serial}`,
      note: note?.trim() || 'Selamat atas ketekunan dan prestasi dalam menjaga serta meningkatkan kemampuan Bahasa Arab.',
      issuedBy: 'Ilman Alfarizi (Perancang Iḥyā’ul ‘Arabiyyah · UIN Mataram)',
      issuedAt: new Date().toISOString(),
    };
    this.data.certificates.unshift(cert);
    this.save();
    return cert;
  }

  public acknowledgeCertificate(certId: string, userId: string): Certificate {
    const cert = this.data.certificates.find((c) => c.id === certId && c.userId === userId);
    if (!cert) throw new Error('Sertifikat tidak ditemukan.');
    cert.acknowledgedAt = cert.acknowledgedAt || new Date().toISOString();
    this.save();
    return cert;
  }

  public getMessages(userId?: string): Message[] {
    if (!userId) return this.data.messages;
    return this.data.messages.filter((m) => m.threadUserId === userId);
  }

  public addMessage(input: Omit<Message, 'id' | 'createdAt'>): Message {
    const msg: Message = {
      ...input,
      id: `msg-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  public markThreadRead(threadUserId: string, readerRole: 'designer' | 'student'): void {
    let changed = false;
    for (const m of this.data.messages) {
      if (m.threadUserId === threadUserId) {
        if (readerRole === 'designer' && !m.readByDesigner) {
          m.readByDesigner = true;
          changed = true;
        }
        if (readerRole === 'student' && !m.readByStudent) {
          m.readByStudent = true;
          changed = true;
        }
      }
    }
    if (changed) this.save();
  }
}

export const db = new Store();
