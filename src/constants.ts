import type { ModuleMeta } from './types';

export const EMBLEM_IMAGE_URL = '/assets/logo-ihya.png';

export const DESIGNER_EMAIL = 'secangkir75@gmail.com';

export const MODULES: ModuleMeta[] = [
  {
    id: 'materi',
    label: 'Materi',
    arabicLabel: 'المَادَّة',
    description: 'Penjelasan kaidah dan dasar bahasa Arab',
  },
  {
    id: 'video',
    label: 'Video',
    arabicLabel: 'الفِيدْيُو',
    description: 'Video pembelajaran dari perancang (tautan & unggahan perangkat)',
  },
  {
    id: 'cerita',
    label: 'Cerita',
    arabicLabel: 'القِصَص',
    description: 'Kisah berbahasa Arab lengkap harakat & terjemahan',
  },
  {
    id: 'menulis',
    label: 'Menulis',
    arabicLabel: 'الكِتَابَة',
    description: 'Latihan menulis kalimat & paragraf bahasa Arab',
    supportsSubmission: true,
  },
  {
    id: 'mendengar',
    label: 'Mendengar',
    arabicLabel: 'الِاسْتِمَاع',
    description: 'Latihan istima’ melalui audio dan pelafalan fasih',
  },
  {
    id: 'menganalisis',
    label: 'Menganalisis',
    arabicLabel: 'التَّحْلِيل',
    description: 'Analisis i’rab, tarkib, dan kedudukan kata',
    supportsSubmission: true,
  },
  {
    id: 'menerjemah',
    label: 'Menerjemah',
    arabicLabel: 'التَّرْجَمَة',
    description: 'Latihan terjemah kontekstual Arab dan Indonesia',
    supportsSubmission: true,
  },
  {
    id: 'ungkapan',
    label: 'Ungkapan Sehari-hari',
    arabicLabel: 'التَّعْبِيرَاتُ اليَوْمِيَّة',
    description: 'Kosakata dan ungkapan percakapan praktis harian',
  },
  {
    id: 'pola',
    label: 'Pola Penyusunan Kalimat',
    arabicLabel: 'تَرَاكِيبُ الجُمَل',
    description: 'Rumus menyusun Jumlah Ismiyyah & Fi’liyyah',
  },
];
