export const ACADEMIC_YEARS = ['2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'];

export const GRADES = [
  { id: '5', label: '5. Sınıf (Ortaokul)' },
  { id: '6', label: '6. Sınıf (Ortaokul)' },
  { id: '7', label: '7. Sınıf (Ortaokul)' },
  { id: '8', label: '8. Sınıf (Ortaokul)' },
  { id: '9', label: '9. Sınıf (Lise)' },
  { id: '10', label: '10. Sınıf (Lise)' },
  { id: '11', label: '11. Sınıf (Lise)' },
  { id: '12', label: '12. Sınıf (Lise)' }
];

export const TRACKS_ANADOLU = [
  { id: 'sayisal', label: 'Sayısal (Fen Bilimleri)' },
  { id: 'ea', label: 'Eşit Ağırlık (Türkçe-Matematik)' },
  { id: 'sozel', label: 'Sözel (Sosyal Bilimler)' },
  { id: 'dil', label: 'Yabancı Dil' }
];

export const TRACKS_MESLEK = [
  { id: 'bilisim', label: 'Bilişim Teknolojileri' },
  { id: 'elektrik', label: 'Elektrik-Elektronik Teknolojisi' },
  { id: 'makine', label: 'Makine ve Tasarım Teknolojisi' },
  { id: 'motor', label: 'Motorlu Araçlar Teknolojisi' },
  { id: 'saglik', label: 'Sağlık / Acil Sağlık Hizmetleri' },
  { id: 'muhasebe', label: 'Muhasebe ve Finansman' },
  { id: 'grafik', label: 'Grafik ve Fotoğraf' },
  { id: 'yiyecek', label: 'Yiyecek ve İçecek Hizmetleri' },
  { id: 'moda', label: 'Moda Tasarım Teknolojileri' }
];

export const MEB_MANDATORY_COURSES: Record<string, {name: string, hours: number}[]> = {
  // ORTAOKUL
  '5': [
    { name: 'Türkçe', hours: 6 },
    { name: 'Matematik', hours: 5 },
    { name: 'Fen Bilimleri', hours: 4 },
    { name: 'Sosyal Bilgiler', hours: 3 },
    { name: 'Yabancı Dil', hours: 3 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Görsel Sanatlar', hours: 1 },
    { name: 'Müzik', hours: 1 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Bilişim Teknolojileri', hours: 2 }
  ],
  '6': [
    { name: 'Türkçe', hours: 6 },
    { name: 'Matematik', hours: 5 },
    { name: 'Fen Bilimleri', hours: 4 },
    { name: 'Sosyal Bilgiler', hours: 3 },
    { name: 'Yabancı Dil', hours: 3 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Görsel Sanatlar', hours: 1 },
    { name: 'Müzik', hours: 1 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Bilişim Teknolojileri', hours: 2 }
  ],
  '7': [
    { name: 'Türkçe', hours: 5 },
    { name: 'Matematik', hours: 5 },
    { name: 'Fen Bilimleri', hours: 4 },
    { name: 'Sosyal Bilgiler', hours: 3 },
    { name: 'Yabancı Dil', hours: 4 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Görsel Sanatlar', hours: 1 },
    { name: 'Müzik', hours: 1 },
    { name: 'Teknoloji ve Tasarım', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 }
  ],
  '8': [
    { name: 'Türkçe', hours: 5 },
    { name: 'Matematik', hours: 5 },
    { name: 'Fen Bilimleri', hours: 4 },
    { name: 'T.C. İnkılap Tarihi', hours: 2 },
    { name: 'Yabancı Dil', hours: 4 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Görsel Sanatlar', hours: 1 },
    { name: 'Müzik', hours: 1 },
    { name: 'Teknoloji ve Tasarım', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Rehberlik', hours: 1 }
  ],
  
  // LISE ORTAK (9-10)
  '9': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Coğrafya', hours: 2 },
    { name: 'Matematik', hours: 6 },
    { name: 'Fizik', hours: 2 },
    { name: 'Kimya', hours: 2 },
    { name: 'Biyoloji', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Sağlık Bilgisi ve Trafik Kültürü', hours: 1 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 }
  ],
  '10': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Coğrafya', hours: 2 },
    { name: 'Matematik', hours: 6 },
    { name: 'Fizik', hours: 2 },
    { name: 'Kimya', hours: 2 },
    { name: 'Biyoloji', hours: 2 },
    { name: 'Felsefe', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 }
  ],

  // 11 SAYISAL
  '11_sayisal': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Felsefe', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'İleri Matematik (Alan Zorunlu)', hours: 6 },
    { name: 'İleri Fizik (Alan Zorunlu)', hours: 4 },
    { name: 'İleri Kimya (Alan Zorunlu)', hours: 4 },
    { name: 'İleri Biyoloji (Alan Zorunlu)', hours: 4 }
  ],
  // 11 ESIT AGIRLIK
  '11_ea': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Felsefe', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'İleri Matematik (Alan Zorunlu)', hours: 6 },
    { name: 'Türk Dİli Edebiyatı (Alan Zorunlu)', hours: 3 },
    { name: 'Coğrafya (Alan Zorunlu)', hours: 4 },
    { name: 'Psikoloji / Sosyoloji (Alan)', hours: 2 }
  ],
  // 11 SÖZEL
  '11_sozel': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Felsefe', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'Türk Dili Edebiyatı (Alan Zorunlu)', hours: 5 },
    { name: 'Coğrafya (Alan Zorunlu)', hours: 4 },
    { name: 'Tarih (Alan Zorunlu)', hours: 4 },
    { name: 'Psikoloji / Mantık (Alan)', hours: 2 }
  ],
  // 11 YABANCI DIl
  '11_dil': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih', hours: 2 },
    { name: 'Felsefe', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'Yabancı Dil Edebiyatı (Alan Zorunlu)', hours: 10 },
    { name: 'Coğrafya / Sosyoloji (Alan)', hours: 4 },
    { name: 'Temel Matematik (Alan Zorunlu)', hours: 2 }
  ],

  // 12 SAYISAL
  '12_sayisal': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'T.C. İnkılap Tarihi', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'İleri Matematik (Alan Zorunlu)', hours: 6 },
    { name: 'İleri Fizik (Alan Zorunlu)', hours: 4 },
    { name: 'İleri Kimya (Alan Zorunlu)', hours: 4 },
    { name: 'İleri Biyoloji (Alan Zorunlu)', hours: 4 }
  ],
  // 12 ESIT AGIRLIK
  '12_ea': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'T.C. İnkılap Tarihi', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'İleri Matematik (Alan Zorunlu)', hours: 6 },
    { name: 'Çağdaş Türk Dünya Tarihi (Alan)', hours: 4 },
    { name: 'Coğrafya (Alan Zorunlu)', hours: 4 },
    { name: 'Mantık / Sosyoloji (Alan)', hours: 2 }
  ],
  // 12 SÖZEL
  '12_sozel': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'T.C. İnkılap Tarihi', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'Türk Dili Edebiyatı (Alan Zorunlu)', hours: 5 },
    { name: 'Çağdaş Türk Dünya Tarihi (Alan)', hours: 4 },
    { name: 'Coğrafya (Alan Zorunlu)', hours: 4 },
    { name: 'Mantık / Sosyoloji (Alan)', hours: 2 }
  ],
  // 12 YABANCI DIL
  '12_dil': [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'T.C. İnkılap Tarihi', hours: 2 },
    { name: 'Birinci Yabancı Dil', hours: 4 },
    { name: 'İkinci Yabancı Dil', hours: 2 },
    { name: 'Beden Eğitimi', hours: 2 },
    { name: 'Görsel Sanatlar / Müzik', hours: 2 },
    { name: 'Yabancı Dil Edebiyatı (Alan Zorunlu)', hours: 10 },
    { name: 'Yabancı Dil Okuma / Konuşma', hours: 4 },
    { name: 'Temel Matematik (Alan Zorunlu)', hours: 2 }
  ]
};

// Generic mapping for vocational (Meslek Liseleri) fallbacks
export const MEB_MANDATORY_MESLEK_GENERIC = [
    { name: 'Türk Dili ve Edebiyatı', hours: 5 },
    { name: 'Din Kültürü', hours: 2 },
    { name: 'Tarih / İnkılap', hours: 2 },
    { name: 'Yabancı Dil', hours: 2 },
    { name: 'Matematik', hours: 3 }
];

export const MEB_ELECTIVES = [
  'İleri Matematik (Seçmeli)',
  'İleri Fizik (Seçmeli)',
  'İleri Kimya (Seçmeli)',
  'İleri Biyoloji (Seçmeli)',
  'Türk Dili ve Edebiyatı (Seçmeli)',
  'Coğrafya (Seçmeli)',
  'Tarih (Seçmeli)',
  'Çağdaş Türk ve Dünya Tarihi',
  'Psikoloji / Sosyoloji',
  'Mantık / Sosyoloji',
  'Yabancı Dil Edebiyatı (Seç.)',
  'Yabancı Dil Okuma / Konuşma',
  'Temel Matematik (Seçmeli)',
  'Mesleki Alan/Dal Eğitimleri',
  'Atölye ve Meslek Uygulamaları',
  'Diksiyon ve Hitabet',
  'Girişimcilik',
  'Astronomi ve Uzay Bilimleri',
  'Yapay Zeka ve Makine Öğrenimi',
  'Uluslararası İlişkiler',
  'Klasik Ahlak Metinleri',
  'Kur’an-ı Kerim',
  'Peygamberimizin Hayatı',
  'Proje Hazırlama',
  'Müzik / Enstrüman',
  'Beden Eğitimi ve Spor',
  'İngilizce Okuma/Yazma Etkinlikleri',
  'Drama'
];
