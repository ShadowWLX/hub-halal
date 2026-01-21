/**
 * API Configuration
 * Centralized configuration for external APIs
 */

export const APIs = {
  quran: {
    baseUrl: 'https://api.alquran.cloud/v1',
    endpoints: {
      surahs: '/surah',
      surah: (number: number) => `/surah/${number}`,
      ayah: (number: number) => `/ayah/${number}`,
      edition: (edition: string) => `/edition/${edition}`,
    },
  },
  
  prayerTimes: {
    baseUrl: 'https://api.aladhan.com/v1',
    endpoints: {
      timings: (date: string, lat: number, lng: number) => 
        `/timings/${date}?latitude=${lat}&longitude=${lng}&method=3`,
      calendar: (year: number, month: number, lat: number, lng: number) =>
        `/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=3`,
    },
  },

  tafsir: {
    baseUrl: 'https://api.quran.com/api/v4',
    endpoints: {
      tafsirs: '/resources/tafsirs',
      tafsir: (tafsirId: number, ayahNumber: number) =>
        `/tafsirs/${tafsirId}/by_ayah/${ayahNumber}`,
    },
  },
}

// Cache configuration
export const CACHE_CONFIG = {
  quran: 24 * 60 * 60 * 1000, // 24 hours
  prayerTimes: 60 * 60 * 1000, // 1 hour
  tafsir: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// Request timeout
export const REQUEST_TIMEOUT = 10000 // 10 seconds
