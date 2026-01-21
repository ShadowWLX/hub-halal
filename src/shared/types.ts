/**
 * Types partagées entre main et renderer
 */

export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Settings {
  id: number
  user_id: number
  language: 'fr' | 'en' | 'ar'
  theme: 'light' | 'dark'
  madhab: 'hanafi' | 'maliki' | 'shafi' | 'hanbali'
  prayer_method: 'mwl' | 'isna' | 'egyptian'
  show_tajweed: boolean
  show_translation: boolean
  show_transliteration: boolean
  font_size: number
  notification_enabled: boolean
  location_latitude: number | null
  location_longitude: number | null
  location_name: string | null
  created_at: string
  updated_at: string
}

export interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

export interface Ayah {
  number: number
  text: string
  surah: number
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajdah: boolean | 'recommended' | 'obligatory'
}

export interface PrayerTime {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
  Imsak: string
  Midnight: string
  Firstthird: string
  Lastthird: string
}

export interface Recitation {
  id: string
  surahNumber: number
  surahName: string
  reciter: string
  reciterId: string
  audioUrl: string
  duration: number
}

export interface Playlist {
  id: number
  user_id: number
  name: string
  description: string | null
  items: PlaylistItem[]
  created_at: string
}

export interface PlaylistItem {
  id: number
  playlist_id: number
  recitation_id: string
  order: number
}

export interface Bookmark {
  id: number
  user_id: number
  surah_number: number
  ayah_number: number
  note: string | null
  created_at: string
}
