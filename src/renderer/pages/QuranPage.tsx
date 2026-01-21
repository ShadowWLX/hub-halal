import React, { useState, useEffect, useRef } from 'react'
import { Search, Settings as SettingsIcon, BookOpenCheck, Play, Pause } from 'lucide-react'
import { getTafsirByAyah, getTafsirsList, getAyahAudio, getReciters, getSurahs, getSurah, getUthmaniTajweedByChapter, getUthmaniByChapter } from '../services/quranApi'
import { puter } from '@heyputer/puter.js'

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

interface Ayah {
  number: number
  text: string
  numberInSurah: number
}

export const QuranPage: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [uthmaniVerses, setUthmaniVerses] = useState<Array<{verse_key: string; text_uthmani: string}>>([])
  const [tajweedVerses, setTajweedVerses] = useState<Array<{verse_key: string; text_uthmani_tajweed: string}>>([])
  const [translation, setTranslation] = useState<any[]>([])
  const [transliteration, setTransliteration] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null)
  const [tafsirContent, setTafsirContent] = useState<string>('')
  const [tafsirId, setTafsirId] = useState<number>(169) // Default: Tafsir Ibn Kathir (common id)
  const [tafsirRawText, setTafsirRawText] = useState<string>('')
  const [translateLang, setTranslateLang] = useState<string>('fr')
  const [translating, setTranslating] = useState<boolean>(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [showTajweedRules, setShowTajweedRules] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [verseVolume, setVerseVolume] = useState<number>(0.9)
  const [verseReciterId, setVerseReciterId] = useState<number | null>(null)
  const [verseReciters, setVerseReciters] = useState<Array<{id:number; name:string}>>([])
  
  // Settings
  const [settings, setSettings] = useState({
    showTranslation: true,
    showTransliteration: false,
    arabicFont: 'uthmani' as 'default' | 'uthmani' | 'tajweed',
    tafsirLang: 'fr',
    fontSize: 48,
    translationSize: 16,
    transliterationSize: 14,
    translationLang: 'fr.hamidullah',
  })

  useEffect(() => {
    fetchSurahs()
  }, [])
  useEffect(() => {
    // Load reciters for verse playback selection
    (async () => {
      const list = await getReciters()
      setVerseReciters(list.map(r => ({ id: r.id, name: r.name })))
      const saved = localStorage.getItem('verse_reciter_id')
      const initial = saved ? parseInt(saved) : (list[0]?.id || null)
      setVerseReciterId(initial)
    })()
  }, [])


  // Open surah from dashboard deep-link if present
  useEffect(() => {
    const toOpen = localStorage.getItem('surah_to_open')
    if (toOpen) {
      const n = parseInt(toOpen)
      if (!isNaN(n)) {
        fetchSurah(n)
      }
      localStorage.removeItem('surah_to_open')
    }
  }, [])

  const fetchSurahs = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/surah')
      const data = await response.json()
      setSurahs(data.data)
    } catch (error) {
      console.error('Error fetching surahs:', error)
    }
  }

  const fetchSurah = async (surahNumber: number, customSettings?: typeof settings) => {
    try {
      const activeSettings = customSettings || settings
      
      // Fetch Arabic text (Uthmani script)
      const arabicResponse = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`
      )
      const arabicData = await arabicResponse.json()
      setAyahs(arabicData.data.ayahs)

      // Fetch Uthmani verses (simple) if selected
      if (activeSettings.arabicFont === 'uthmani') {
        const uthmaniData = await getUthmaniByChapter(surahNumber)
        setUthmaniVerses(uthmaniData)
      } else {
        setUthmaniVerses([])
      }

      // Fetch Tajweed verses if selected
      if (activeSettings.arabicFont === 'tajweed') {
        const tajweedData = await getUthmaniTajweedByChapter(surahNumber)
        setTajweedVerses(tajweedData)
      } else {
        setTajweedVerses([])
      }

      // Fetch translation if enabled
      if (activeSettings.showTranslation) {
        const translationResponse = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/${activeSettings.translationLang}`
        )
        const translationData = await translationResponse.json()
        setTranslation(translationData.data.ayahs)
      } else {
        setTranslation([])
      }

      // Fetch transliteration if enabled
      if (activeSettings.showTransliteration) {
        const transliterationResponse = await fetch(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/en.transliteration`
        )
        const transliterationData = await transliterationResponse.json()
        setTransliteration(transliterationData.data.ayahs)
      } else {
        setTransliteration([])
      }
      
      setSelectedSurah(surahNumber)
    } catch (error) {
      console.error('Error fetching surah:', error)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)
    
    // Refetch surah if font or text settings changed
    if ((key === 'showTranslation' || key === 'translationLang' || key === 'showTransliteration' || key === 'arabicFont') && selectedSurah) {
      fetchSurah(selectedSurah, updatedSettings)
    }
  }

  const fetchTafsir = async (surahNumber: number, ayahNumber: number) => {
    try {
      setTafsirAyah(ayahNumber)
      const ayahKey = `${surahNumber}:${ayahNumber}`
      const tafsir = await getTafsirByAyah(ayahKey, tafsirId)
      const surahName = surahs.find(s => s.number === surahNumber)?.englishName || `Sourate ${surahNumber}`
      setTafsirRawText(tafsir?.text || '')
      if (tafsir?.text) {
        setTafsirContent(`
          <div style="padding: 1rem; border-radius: 0.5rem; background: #dbeafe; border-left: 4px solid #1a472a;">
            <p style="margin: 0; color: #1e3a8a; font-weight: 600;">📚 Tafsir (${tafsir.resource?.name || 'Quran.com'})</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #1e3a8a;">Verset ${ayahNumber} de ${surahName}</p>
            <div style="margin-top: 0.75rem; font-size: 0.95rem; color: #1e3a8a; line-height: 1.6;">${tafsir.text}</div>
          </div>
        `)
      } else {
        setTafsirContent(`
          <div style="padding: 1rem; border-radius: 0.5rem; background: #fee2e2; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #7f1d1d; font-weight: 600;">⚠️ Tafsir indisponible</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #7f1d1d;">Aucun tafsir trouvé pour ce verset.</p>
          </div>
        `)
        setTafsirRawText('')
      }
      setTranslationError(null)
    } catch (error) {
      console.error('Error fetching tafsir:', error)
      setTafsirContent(`
        <div style="padding: 1rem; border-radius: 0.5rem; background: #fee2e2; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #7f1d1d; font-weight: 600;">⚠️ Error loading tafsir</p>
          <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #7f1d1d;">
            Unable to load tafsir at this moment. Please try again later.
          </p>
        </div>
      `)
      setTafsirAyah(ayahNumber)
    }
  }

  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.name.includes(searchQuery) ||
      surah.number.toString().includes(searchQuery)
  )

  // Convert numbers to Arabic-Indic numerals
  const toArabicNumbers = (num: number): string => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return String(num).split('').map(d => arabicDigits[parseInt(d)]).join('')
  }

  const selectedSurahData = surahs.find(s => s.number === selectedSurah)

  const playAyah = async (surahNumber: number, ayahNumber: number) => {
    if (!audioRef.current) return
    const ayahKey = `${surahNumber}:${ayahNumber}`
    const paddedSurah = String(surahNumber).padStart(3, '0')
    const paddedAyah = String(ayahNumber).padStart(3, '0')
    // If already playing this ayah, toggle pause
    if (playingAyah === ayahNumber && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    audioRef.current.volume = verseVolume
    const tryPlay = async (url: string) => {
      const audio = audioRef.current
      if (!audio) return false
      audio.pause()
      audio.currentTime = 0
      audio.src = url
      try {
        await audio.play()
        return true
      } catch (err) {
        console.warn('Fallback ayah audio failed, trying next source', url, err)
        return false
      }
    }

    // Try API first with selected reciter
    if (verseReciterId) {
      const file = await getAyahAudio(verseReciterId, ayahKey)
      if (file?.url && await tryPlay(file.url)) {
        setPlayingAyah(ayahNumber)
        setIsPlaying(true)
        return
      }
    }

    // Fallback to CDN across multiple known reciters, then mirror
    const cdnCandidates = ['ar.husary','ar.hudhaify','ar.minshawi','ar.alafasy']
      .map(r => `https://cdn.islamic.network/quran/audio/ayah/${r}/${ayahKey}.mp3`)
    const mirrorCandidates = [
      `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/${paddedSurah}${paddedAyah}.mp3`,
    ]
    const fallbacks = [...cdnCandidates, ...mirrorCandidates]

    for (const u of fallbacks) {
      if (await tryPlay(u)) {
        setPlayingAyah(ayahNumber)
        setIsPlaying(true)
        return
      }
    }
    console.error('Verse playback error: no available audio for this ayah (API + CDN fallbacks failed)')
  }

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const translateTafsir = async () => {
    if (!tafsirRawText) {
      setTranslationError('Aucun texte à traduire pour ce verset.')
      return
    }
    setTranslationError(null)
    setTranslating(true)
    try {
      const plain = tafsirRawText.replace(/<[^>]+>/g, ' ')
      const prompt = `Traduis en ${translateLang === 'fr' ? 'français' : translateLang} ce tafsir, conserve un ton clair et la compréhension globale, sans ajouter de commentaires. Contenu à traduire:\n${plain}`

      // Initialiser Puter si nécessaire (authentification automatique via popup)
      if ((puter as any).auth && !(await (puter as any).auth?.isLoggedIn?.())) {
        try {
          await (puter as any).auth?.signIn?.()
        } catch (authErr) {
          console.warn('Authentification Puter annulée ou échouée', authErr)
          throw new Error('Authentification Puter requise')
        }
      }

      // Utiliser gemini-2.5-flash-lite pour réduire la consommation
      const res: any = await (puter as any).ai?.chat?.(prompt, { model: 'gemini-2.5-flash-lite' })
      const text = typeof res === 'string'
        ? res
        : res?.message || res?.content || res?.response || JSON.stringify(res)

      if (!text) {
        throw new Error('Réponse vide de Puter')
      }

      const escaped = escapeHtml(String(text)).replace(/\n/g, '<br/>')
      setTafsirContent(`
        <div style="padding: 1rem; border-radius: 0.5rem; background: #ecfeff; border-left: 4px solid #0891b2;">
          <p style="margin: 0; color: #0e7490; font-weight: 600;">🌐 Traduction (IA Puter) - ${translateLang.toUpperCase()}</p>
          <div style="margin-top: 0.75rem; font-size: 0.95rem; color: #0f172a; line-height: 1.6;">${escaped}</div>
        </div>
      `)
      setTranslationError(null)
    } catch (err: any) {
      console.error('Erreur de traduction IA Puter', err)
      setTranslationError('Traduction échouée. Une authentification Puter est requise.')
    } finally {
      setTranslating(false)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = verseVolume
  }, [verseVolume])

  return (
    <div className="h-full flex gap-6 p-6 bg-gray-50 dark:bg-gray-900">
      {/* Surahs List */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg text-islamic-primary dark:text-islamic-accent mb-3">
            Sourates
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-islamic-accent"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.number}
              onClick={() => fetchSurah(surah.number)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                selectedSurah === surah.number
                  ? 'bg-islamic-accent text-white'
                  : 'hover:bg-islamic-light dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-islamic-primary dark:bg-islamic-accent flex items-center justify-center text-white font-bold text-sm">
                  {surah.number}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{surah.englishName}</div>
                  <div className="text-xs opacity-70">{surah.englishNameTranslation}</div>
                </div>
                <div className="text-xl font-arabic">{surah.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ayahs Display */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {selectedSurah ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-islamic-primary dark:text-islamic-accent">
                  {selectedSurahData?.number}. {selectedSurahData?.englishName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedSurahData?.englishNameTranslation} • {selectedSurahData?.numberOfAyahs} ayahs • {selectedSurahData?.revelationType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {settings.tajweedFont && (
                  <button
                    onClick={() => setShowTajweedRules(!showTajweedRules)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-islamic-primary dark:bg-islamic-accent text-white hover:opacity-90 transition-opacity"
                  >
                    📋 Règles Tajweed
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <SettingsIcon size={20} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 max-h-80 overflow-y-auto">
                <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Récitateur pour lecture de verset
                                      </label>
                                      <select
                                        value={verseReciterId ?? ''}
                                        onChange={(e) => {
                                          const id = parseInt(e.target.value)
                                          setVerseReciterId(id)
                                          localStorage.setItem('verse_reciter_id', String(id))
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                      >
                                        {verseReciters.length > 0 ? verseReciters.map(r => (
                                          <option key={r.id} value={r.id}>{r.name}</option>
                                        )) : (
                                          <option value="">Sélectionnez un récitateur</option>
                                        )}
                                      </select>
                                    </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.showTranslation}
                      onChange={(e) => handleSettingChange('showTranslation', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Afficher la traduction</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.showTransliteration}
                      onChange={(e) => handleSettingChange('showTransliteration', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Afficher la phonétique</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Police arabe
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="arabicFont"
                          value="uthmani"
                          checked={settings.arabicFont === 'uthmani'}
                          onChange={(e) => handleSettingChange('arabicFont', e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Uthmani (Police .ttf)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="arabicFont"
                          value="tajweed"
                          checked={settings.arabicFont === 'tajweed'}
                          onChange={(e) => handleSettingChange('arabicFont', e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Tajweed Coloré</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taille texte arabe: {settings.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="48"
                      value={settings.fontSize}
                      onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {settings.showTranslation && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Taille traduction: {settings.translationSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="24"
                          value={settings.translationSize}
                          onChange={(e) => handleSettingChange('translationSize', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Langue de traduction
                        </label>
                        <select
                          value={settings.translationLang}
                          onChange={(e) => handleSettingChange('translationLang', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="fr.hamidullah">Français (Hamidullah)</option>
                          <option value="en.sahih">English (Sahih International)</option>
                          <option value="en.pickthall">English (Pickthall)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {settings.showTransliteration && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Taille phonétique: {settings.transliterationSize}px
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="20"
                        value={settings.transliterationSize}
                        onChange={(e) => handleSettingChange('transliterationSize', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-y-auto flex-1 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              {/* Bismillah Calligraphique */}
              {selectedSurah !== 1 && selectedSurah !== 9 && (
                <div className="text-center mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <svg viewBox="0 0 512 80" className="w-full max-w-md mx-auto text-islamic-primary dark:text-islamic-accent" fill="currentColor">
                    <text x="256" y="50" fontSize="32" fontFamily="'Noto Naskh Arabic', serif" textAnchor="middle" dominantBaseline="middle">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </text>
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux
                  </p>
                </div>
              )}

              {/* Hidden audio element for verse playback */}
              <audio ref={audioRef} />

              <div className="space-y-6 max-w-4xl mx-auto">
                {ayahs.map((ayah) => {
                  const translationItem = translation.find(t => t.numberInSurah === ayah.numberInSurah || t.number === ayah.number)
                  const transliterationItem = transliteration.find(t => t.numberInSurah === ayah.numberInSurah || t.number === ayah.number)
                  const uthmaniItem = uthmaniVerses.find(t => t.verse_key.endsWith(`:${ayah.numberInSurah}`))
                  const tajweedItem = tajweedVerses.find(t => t.verse_key.endsWith(`:${ayah.numberInSurah}`))
                  
                  return (
                    <div key={ayah.number} className="group">
                      <div className="p-5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-islamic-primary dark:bg-islamic-accent flex items-center justify-center text-white font-bold text-sm">
                            {ayah.numberInSurah}
                          </div>
                          <div className="flex-1 space-y-3">
                            {settings.arabicFont === 'tajweed' && tajweedItem ? (
                              <div
                                className="text-right font-tajweed leading-loose text-gray-900 dark:text-gray-100"
                                style={{ fontSize: `${settings.fontSize}px`, lineHeight: '2.2' }}
                                dir="rtl"
                                dangerouslySetInnerHTML={{ __html: tajweedItem.text_uthmani_tajweed }}
                              />
                            ) : (
                              <p
                                className="text-right font-uthmani-ttf leading-loose text-gray-900 dark:text-gray-100"
                                style={{ fontSize: `${settings.fontSize}px`, lineHeight: '2.2' }}
                                dir="rtl"
                              >
                                {uthmaniItem?.text_uthmani} <span className="text-islamic-accent dark:text-islamic-primary font-bold">{toArabicNumbers(ayah.numberInSurah)}</span>
                              </p>
                            )}

                            {settings.showTransliteration && transliterationItem && (
                              <p 
                                className="text-gray-600 dark:text-gray-400 italic leading-relaxed"
                                style={{ fontSize: `${settings.transliterationSize}px` }}
                              >
                                {transliterationItem.text}
                              </p>
                            )}

                            {settings.showTranslation && translationItem && (
                              <p 
                                className="text-gray-700 dark:text-gray-300 leading-relaxed pl-4 border-l-2 border-islamic-accent"
                                style={{ fontSize: `${settings.translationSize}px` }}
                              >
                                {translationItem.text}
                              </p>
                            )}

                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => fetchTafsir(selectedSurah, ayah.numberInSurah)}
                                className="flex items-center gap-2 text-sm text-islamic-primary dark:text-islamic-accent hover:underline"
                              >
                                <BookOpenCheck size={16} />
                                <span>Tafsir</span>
                              </button>
                              <button
                                onClick={() => selectedSurah && playAyah(selectedSurah, ayah.numberInSurah)}
                                className={`flex items-center gap-2 text-sm ${playingAyah === ayah.numberInSurah && isPlaying ? 'text-red-600' : 'text-islamic-primary dark:text-islamic-accent'} hover:underline`}
                              >
                                {playingAyah === ayah.numberInSurah && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                <span>{playingAyah === ayah.numberInSurah && isPlaying ? 'Pause' : 'Lire le verset'}</span>
                              </button>
                              {/* Verse volume */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Vol.</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={verseVolume}
                                  onChange={(e) => setVerseVolume(parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-lg">Sélectionnez une sourate pour commencer</p>
            </div>
          </div>
        )}
      </div>)

      {/* Tafsir Modal */}
      {tafsirAyah !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">
                Tafsir - Verset {tafsirAyah}
              </h3>
              <button
                onClick={() => setTafsirAyah(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">Langue cible</label>
                <select
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                </select>
                <button
                  onClick={translateTafsir}
                  disabled={translating}
                  className={`px-4 py-2 rounded-lg text-white ${translating ? 'bg-gray-400' : 'bg-islamic-primary hover:bg-islamic-accent'}`}
                >
                  {translating ? 'Traduction...' : 'Traduire (IA)'}
                </button>
              </div>
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ La traduction dépend du quota Puter. Si le quota est atteint, la traduction ne fonctionnera pas.
                </p>
              </div>
              {translationError && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {translationError}
                </div>
              )}
              <div 
                className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: tafsirContent }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tajweed Rules Modal */}
      {showTajweedRules && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">
                📋 Règles Tajweed
              </h3>
              <button
                onClick={() => setShowTajweedRules(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-4">
                {[
                  { name: 'Hamza Wasl', class: 'ham_wasl' },
                  { name: 'Laam Shamsiyah', class: 'laam_shamsiyah' },
                  { name: 'Madda Normal', class: 'madda_normal' },
                  { name: 'Madda Obligatory', class: 'madda_obligatory' },
                  { name: 'Madda Permissible', class: 'madda_permissible' },
                  { name: 'Ghunnah', class: 'ghunnah' },
                  { name: 'Idgham Shafawi', class: 'idgham_shafawi' },
                  { name: 'Idgham with Ghunnah', class: 'idgham_ghunnah' },
                  { name: 'Ikhafa', class: 'ikhafa' },
                  { name: 'Silent Letters', class: 'slnt' },
                ].map((rule) => (
                  <div key={rule.class} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`flex-shrink-0 w-24 h-10 rounded flex items-center justify-center text-white font-semibold text-sm`}
                      style={{
                        backgroundColor: rule.class === 'ham_wasl' ? '#1a6b3e' :
                          rule.class === 'laam_shamsiyah' ? '#9b2c2c' :
                          rule.class === 'madda_normal' ? '#6b21a8' :
                          rule.class === 'madda_obligatory' ? '#581c87' :
                          rule.class === 'madda_permissible' ? '#7c3aed' :
                          rule.class === 'ghunnah' ? '#d97706' :
                          rule.class === 'idgham_shafawi' ? '#0369a1' :
                          rule.class === 'idgham_ghunnah' ? '#0891b2' :
                          rule.class === 'ikhafa' ? '#dc2626' :
                          rule.class === 'slnt' ? '#6b7280' : '#000000'
                      }}
                    >
                      {rule.name.substring(0, 3)}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {rule.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
