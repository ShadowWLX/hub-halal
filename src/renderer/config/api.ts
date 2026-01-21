// API Configuration for Hub Halal
// These keys are public and safe to include in the client app
// Endpoints are hardcoded and switch based on build mode (no .env files needed)

import { ENV } from './env'

// Hardcoded credentials and endpoints - different keys for prelive vs production
// Pre-Production (Test): Limited data, all features enabled for testing
// Production (Live): Full Qur'ān content, NO authentication/user features by default

const quranConfig = ENV.isRelease ? {
  // Production (Live)
  clientId: '01ebfe6d-0ee0-4182-a430-df3297fa13fa',
  clientSecret: 'l~ZUu3fSfJgbm8oYpcINS4lRyy',
  endpoint: 'https://oauth2.quran.foundation',
  baseUrl: 'https://apis.quran.foundation/content/api/v4'
} : {
  // Pre-Production (Test)
  clientId: 'f8c2eeae-9b15-4519-9525-95a2c48e03e9',
  clientSecret: 'e-qzAX8smpyrrcQBf-OC5YsX-1',
  endpoint: 'https://prelive-oauth2.quran.foundation',
  baseUrl: 'https://apis-prelive.quran.foundation/content/api/v4'
}

export const API_CONFIG = {
  // Quran.Foundation API (production in release builds, prelive in dev)
  quran: quranConfig,
  
  // AlQuran Cloud API (fallback)
  alquran: {
    baseUrl: 'https://api.alquran.cloud/v1'
  },
  
  // Aladhan Prayer Times API
  aladhan: {
    baseUrl: 'https://api.aladhan.com/v1'
  },
  
  // Nominatim Geocoding API
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org'
  },
  
  // MP3 Quran Audio
  audio: {
    baseUrl: 'https://server13.mp3quran.net'
  }
}

// Note: Ces clés sont publiques et destinées à être utilisées dans des applications client.
// Elles sont fournies par Quran.Foundation pour un usage non-commercial et éducatif.
