// Quran.Foundation API Client
// https://api-docs.quran.foundation/
// Base URL: driven by ENV (prelive in dev, production in release)

import { API_CONFIG } from '../config/api'

const OAUTH_BASE = API_CONFIG.quran.endpoint
const QURAN_API_BASE = API_CONFIG.quran.baseUrl
const CLIENT_ID = API_CONFIG.quran.clientId
const CLIENT_SECRET = API_CONFIG.quran.clientSecret

// Token cache
let accessToken: string | null = null
let tokenExpiry: number = 0

interface QuranVerse {
  verse_key: string
  text_uthmani: string
  text_imlaei?: string
  translations?: Array<{
    resource_id: number
    text: string
    language_name: string
  }>
  transliteration?: {
    text: string
    language_name: string
  }
}

interface ChapterInfo {
  id: number
  chapter_number: number
  name_simple: string
  name_arabic: string
  name_complex: string
  revelation_place: string
  verses_count: number
  pages: number[]
}

interface AudioFile {
  chapter_number: number
  file_size: number
  format: string
  url: string
  duration: number
}

interface Reciter {
  id: number
  name: string
  translated_name?: {
    name: string
    language_name: string
  }
}

// Internal: perform a token request. useBodyAuth toggles between Basic auth (recommended)
// and sending client_id/client_secret in the form body (fallback for some setups).
const requestToken = async (useBodyAuth: boolean) => {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  if (!useBodyAuth) {
    headers['Authorization'] = `Basic ${credentials}`
  }

  const bodyParts = ['grant_type=client_credentials', 'scope=content']
  if (useBodyAuth) {
    bodyParts.push(`client_id=${encodeURIComponent(CLIENT_ID)}`)
    bodyParts.push(`client_secret=${encodeURIComponent(CLIENT_SECRET)}`)
  }

  const response = await fetch(`${OAUTH_BASE}/oauth2/token`, {
    method: 'POST',
    headers,
    body: bodyParts.join('&'),
  })

  const text = await response.text()
  const isJson = text.startsWith('{')
  const parsed = isJson ? JSON.parse(text) : null

  if (!response.ok) {
    const errCode = parsed?.error
    console.error('OAuth2 token request failed', response.status, errCode || text)
    return { ok: false, errCode, parsed }
  }

  return { ok: true, parsed }
}

// Obtain OAuth2 access token using client_credentials grant
const getAccessToken = async (): Promise<string> => {
  // Return cached token if still valid (with 30s buffer)
  const now = Date.now()
  if (accessToken && tokenExpiry > now + 30000) {
    return accessToken
  }

  console.log('Requesting new OAuth2 access token...')

  try {
    // First try with HTTP Basic (recommended by docs)
    const first = await requestToken(false)

    let tokenResponse = first
    if (!first.ok && first.errCode === 'invalid_client') {
      // Fallback: send client_id/client_secret in body (some servers require it)
      console.warn('Retrying token request with client_id/client_secret in body due to invalid_client')
      tokenResponse = await requestToken(true)
    }

    if (!tokenResponse.ok) {
      throw new Error(`OAuth2 failed: ${tokenResponse.errCode || 'unknown_error'}`)
    }

    const data = tokenResponse.parsed || {}
    accessToken = data.access_token
    tokenExpiry = now + (data.expires_in * 1000)

    console.log('OAuth2 token obtained successfully, expires in', data.expires_in, 'seconds')
    return accessToken as string
  } catch (error) {
    console.error('Failed to obtain OAuth2 token:', error)
    throw error
  }
}

// Get headers with OAuth2 token
const getHeaders = async () => {
  const token = await getAccessToken()
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-auth-token': token,
    'x-client-id': CLIENT_ID || '',
  }
}

// Get all chapters (114 surahs)
export const getChapters = async (): Promise<ChapterInfo[]> => {
  try {
    const headers = await getHeaders()
    // Request all chapters; try a high per_page to avoid pagination truncation
    const url = `${QURAN_API_BASE}/chapters?page=1&per_page=300`
    const response = await fetch(url, {
      headers,
    })
    const text = await response.text()

    if (!response.ok) {
      console.error('Chapters fetch failed:', response.status, text)
      throw new Error(`HTTP ${response.status}`)
    }

    const data = JSON.parse(text)
    console.log('Chapters API response count:', data.chapters?.length, 'meta:', data.meta, 'raw:', text.slice(0, 200))
    return data.chapters || []
  } catch (error) {
    console.error('Error fetching chapters:', error)
    return []
  }
}

// Get verses for a specific chapter with translation
export const getVersesByChapter = async (
  chapterNumber: number,
  translationId: number = 131 // 131 = French (Hamidullah)
): Promise<QuranVerse[]> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${chapterNumber}?language=en&translations=${translationId}&fields=text_uthmani,text_imlaei`,
      {
        headers,
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.verses || []
  } catch (error) {
    console.error('Error fetching verses:', error)
    return []
  }
}

// Get Uthmani Script (plain, no tajweed)
export const getUthmaniByChapter = async (
  chapterNumber: number
): Promise<Array<{ verse_key: string; text_uthmani: string }>> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(
      `${QURAN_API_BASE}/quran/verses/uthmani?chapter_number=${chapterNumber}`,
      {
        headers,
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.verses || []
  } catch (error) {
    console.error('Error fetching uthmani verses:', error)
    return []
  }
}

// Get Uthmani Tajweed (color-coded text with tajweed rules as HTML tags)
export const getUthmaniTajweedByChapter = async (
  chapterNumber: number
): Promise<Array<{ verse_key: string; text_uthmani_tajweed: string }>> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(
      `${QURAN_API_BASE}/quran/verses/uthmani_tajweed?chapter_number=${chapterNumber}`,
      {
        headers,
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.verses || []
  } catch (error) {
    console.error('Error fetching tajweed verses:', error)
    return []
  }
}

// Get available translations
export const getTranslations = async () => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${QURAN_API_BASE}/resources/translations`, {
      headers,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.translations || []
  } catch (error) {
    console.error('Error fetching translations:', error)
    return []
  }
}

// Get chapter info
export const getChapterInfo = async (chapterNumber: number): Promise<ChapterInfo | null> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${QURAN_API_BASE}/chapters/${chapterNumber}`, {
      headers,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.chapter || null
  } catch (error) {
    console.error('Error fetching chapter info:', error)
    return null
  }
}

// Get audio file for a chapter from a specific reciter
// This returns the FULL SURAH audio, not individual verses
export const getChapterRecitation = async (
  reciterId: number,
  chapterNumber: number,
  opts?: { quiet?: boolean }
): Promise<AudioFile | null> => {
  try {
    const url = `${QURAN_API_BASE}/chapter_recitations/${reciterId}/${chapterNumber}`
    if (!opts?.quiet) {
      console.log(`Fetching full surah ${chapterNumber} audio from reciter ${reciterId}: ${url}`)
    }
    
    const headers = await getHeaders()
    const response = await fetch(url, {
      headers,
    })
    
    if (!response.ok) {
      const text = await response.text()
      if (!opts?.quiet) {
        console.error(`Failed to fetch recitation: HTTP ${response.status}`, text)
      }
      return null
    }
    
    const data = await response.json()

    // Handle multiple possible shapes from the API
    // 1) { audio_file: { url/audio_url, duration, ... } }
    // 2) { audio_files: [ { url/audio_url/path, duration } ] }
    // 3) { chapter_recitation: { url/audio_url/path, duration } }
    let audio: any = data.audio_file || null

    // Normalize audio_file if it exists but has audio_url instead of url
    if (audio && !audio.url && audio.audio_url) {
      audio = {
        url: audio.audio_url,
        duration: audio.duration,
        file_size: audio.file_size,
        format: audio.format,
        chapter_id: audio.chapter_id,
        id: audio.id,
      }
    }

    if (!audio && Array.isArray(data.audio_files) && data.audio_files.length > 0) {
      const candidate = data.audio_files[0]
      audio = {
        url: candidate.url || candidate.audio_url || candidate.path,
        duration: candidate.duration,
        file_size: candidate.file_size,
        format: candidate.format,
      }
    }

    if (!audio && data.chapter_recitation) {
      const cr = data.chapter_recitation
      audio = {
        url: cr.url || cr.audio_url || cr.path,
        duration: cr.duration,
        file_size: cr.file_size,
        format: cr.format,
      }
    }

    if (!opts?.quiet) {
      console.log(`Surah ${chapterNumber} audio:`, audio?.url ? 'URL received' : 'No URL', audio || data)
    }
    return audio?.url ? audio : null
  } catch (error) {
    if (!opts?.quiet) {
      console.error('Error fetching recitation:', error)
    }
    return null
  }
}

// Get list of available reciters
export const getReciters = async (): Promise<Reciter[]> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${QURAN_API_BASE}/resources/recitations`, {
      headers,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    // Normalize name field (API uses reciter_name)
    const recitations = data.recitations || []
    return recitations.map((r: any) => ({
      id: r.id,
      name: r.name || r.reciter_name || 'Unknown',
      translated_name: r.translated_name,
      style: r.style,
      raw: r,
    }))
  } catch (error) {
    console.error('Error fetching reciters:', error)
    return []
  }
}

// Get Ayah recitations for specific ayah using Quran.Foundation
// Endpoint: /recitations/:recitation_id/by_ayah/:ayah_key
export const getAyahAudio = async (
  reciterId: number,
  ayahKey: string
): Promise<AudioFile | null> => {
  try {
    const headers = await getHeaders()
    const url = `${QURAN_API_BASE}/recitations/${reciterId}/by_ayah/${encodeURIComponent(ayahKey)}`
    const response = await fetch(url, { headers })
    if (!response.ok) {
      const text = await response.text()
      console.warn('Ayah audio fetch failed:', response.status, text)
      return null
    }
    const data = await response.json()
    // Returns { audio_files: [ ... ], pagination: { ... } }
    const files = Array.isArray(data.audio_files) ? data.audio_files : []
    if (files.length === 0) return null
    const f = files[0]
    const urlField = f.url || f.audio_url || f.path
    return urlField ? {
      chapter_number: f.chapter_number || 0,
      file_size: f.file_size || 0,
      format: f.format || 'mp3',
      url: urlField,
      duration: f.duration || 0,
    } : null
  } catch (e) {
    console.error('Error fetching ayah audio:', e)
    return null
  }
}

// Quran.Foundation Tafsir API
// Endpoint: /tafsirs/:resource_id/by_ayah/:ayah_key

export const getTafsirsList = async () => {
  try {
    const headers = await getHeaders()
    const res = await fetch(`${QURAN_API_BASE}/resources/tafsirs`, {
      headers,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.tafsirs || []
  } catch (e) {
    console.error('Error fetching tafsirs list:', e)
    return []
  }
}

export const getTafsirByAyah = async (ayahKey: string, resourceId: number = 169) => {
  try {
    // Correct endpoint: /tafsirs/:resource_id/by_ayah/:ayah_key
    // Example: /tafsirs/169/by_ayah/1:1 for Al-Fatiha verse 1 with tafsir 169
    const url = `${QURAN_API_BASE}/tafsirs/${resourceId}/by_ayah/${ayahKey}`
    console.log(`Fetching tafsir for ${ayahKey} with resource ID ${resourceId}: ${url}`)
    
    const headers = await getHeaders()
    const res = await fetch(url, {
      headers,
    })
    
    if (!res.ok) {
      console.error(`Tafsir fetch failed: HTTP ${res.status}`)
      throw new Error(`HTTP ${res.status}`)
    }
    
    const data = await res.json()
    console.log('Tafsir data received:', data)
    return data.tafsir || null
  } catch (e) {
    console.error('Error fetching tafsir by ayah:', e)
    return null
  }
}

// Get verse audio URL from CDN (for playing individual verses)
// Correct format (ayah route): https://cdn.islamic.network/quran/audio/ayah/ar.alafasy/{surah}:{verse}.mp3
export const getVerseAudioUrl = (surahNumber: number, verseNumber: number): string => {
  return `https://cdn.islamic.network/quran/audio/ayah/ar.alafasy/${surahNumber}:${verseNumber}.mp3`
}

// Search verses
export const searchVerses = async (query: string, language: string = 'en') => {
  try {
    const headers = await getHeaders()
    const response = await fetch(
      `${QURAN_API_BASE}/search?q=${encodeURIComponent(query)}&language=${language}`,
      {
        headers,
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.search?.results || []
  } catch (error) {
    console.error('Error searching verses:', error)
    return []
  }
}
