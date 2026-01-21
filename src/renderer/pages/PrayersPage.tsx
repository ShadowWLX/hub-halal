import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Clock, Settings as SettingsIcon, Edit2, X, Bell, Upload, Play, Pause, Volume2 } from 'lucide-react'
import { AlternatingDate } from '../components/AlternatingDate'
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  showPrayerNotification,
  shouldNotifyForPrayer,
  sendTestNotification
} from '../services/notificationService'
import { ENV } from '../config/env'

interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
}

interface CityOption {
  name: string
  lat: number
  lon: number
}

export const PrayersPage: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, city: '' })
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [countdown, setCountdown] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([])
  const [modalTab, setModalTab] = useState<'manual' | 'nearby'>('manual')
  const [settings, setSettings] = useState({
    method: 12, // UOIF (default)
    notifications: true,
    adhanFile: undefined as string | undefined,
  })
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [notifiedPrayers, setNotifiedPrayers] = useState<Set<string>>(new Set()) // Track which prayers we've notified for
    const [playedAdhanPrayers, setPlayedAdhanPrayers] = useState<Set<string>>(new Set()) // Track which prayers we've played adhan for
  const [showAdhanControl, setShowAdhanControl] = useState(false)
  const [adhanPlaying, setAdhanPlaying] = useState(false)
  const [adhanVolume, setAdhanVolume] = useState(0.3)
  const [adhanProgress, setAdhanProgress] = useState(0)
  const [adhanCurrentTime, setAdhanCurrentTime] = useState(0)
  const [adhanDuration, setAdhanDuration] = useState(0)
  const [duaVisibleUntil, setDuaVisibleUntil] = useState<number | null>(null)
  const adhanAudioRef = useRef<HTMLAudioElement>(null)
  const showTestFeatures = ENV.enableTestFeatures && !ENV.isRelease

  const formatTime = (seconds: number) => {
    if (!seconds || !Number.isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('halal_prayer_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Error loading prayer settings:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Load location from localStorage
    const savedLocation = localStorage.getItem('halal_location')
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation)
        setLocation(parsed)
        
        // Check if we already have today's prayer times cached
        const cachedPrayers = localStorage.getItem('halal_prayers')
        const cachedDate = localStorage.getItem('halal_prayers_date')
        const today = new Date().toISOString().split('T')[0]
        
        if (cachedPrayers && cachedDate === today) {
          // Load cached prayers for today
          setPrayerTimes(JSON.parse(cachedPrayers))
        } else {
          // Fetch fresh prayers - pass settings.method
          fetchPrayerTimes(parsed.latitude, parsed.longitude, settings.method)
        }
      } catch (e) {
        console.error('Error loading saved location:', e)
        getLocation()
      }
    } else {
      // No saved location, get it from geolocation
      getLocation()
    }
  }, [])

  // Update countdown every second
  // Update countdown every second and check for notifications
  useEffect(() => {
    const timer = setInterval(() => {
      updateCountdown()
    }, 1000)
    return () => clearInterval(timer)
  }, [prayerTimes, settings.notifications, notifiedPrayers])

  const updateCountdown = () => {
    if (!prayerTimes) return
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const currentSeconds = now.getSeconds()

    if (duaVisibleUntil && Date.now() > duaVisibleUntil) {
      setDuaVisibleUntil(null)
    }
    
    // Find next prayer
    for (const prayer of mainPrayers) {
      const [hours, minutes] = prayerTimes[prayer as keyof PrayerTimes].split(':')
      const prayerTime = parseInt(hours) * 60 + parseInt(minutes)
      
      const diff = prayerTime - currentTime
      const totalSecondsRemaining = (diff * 60) - currentSeconds
      
      // If within 15 minutes after prayer time
      if (diff < 0 && Math.abs(diff) <= 15) {
        setCountdown(`${prayerNames[prayer]} - MAINTENANT`)
        return
      }
      
      // If it's prayer time (0 minutes, 0 seconds) - auto-play adhan
      if (diff === 0 && currentSeconds === 0 && !notifiedPrayers.has(prayer)) {
        if (settings.adhanEnabled) {
          playAdhanSound()
        }
        setNotifiedPrayers(prev => new Set(prev).add(prayer))
      }
      
      if (diff > 0) {
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        
        // Show seconds if under 1 minute
        if (diff === 0 && totalSecondsRemaining > 0) {
          const secs = totalSecondsRemaining
          setCountdown(`Prochain: ${prayerNames[prayer]} dans ${secs}s`)
        } else {
          setCountdown(`Prochain: ${prayerNames[prayer]} dans ${hours}h ${mins}m`)
        }
        
        // Check if we should notify for this prayer (5 min before)
        if (settings.notifications && diff <= 5 && !notifiedPrayers.has(prayer + '_notif')) {
          showPrayerNotification(prayerNames[prayer], prayerTimes[prayer as keyof PrayerTimes], settings.adhanFile)
          setNotifiedPrayers(prev => new Set(prev).add(prayer + '_notif'))
        }
        return
      }
    }
    
    // If no prayer found, next is Fajr tomorrow
    const [fajrHours, fajrMinutes] = prayerTimes.Fajr.split(':')
    const fajrTime = parseInt(fajrHours) * 60 + parseInt(fajrMinutes)
    const diff = (24 * 60 - currentTime) + fajrTime
    const hours = Math.floor(diff / 60)
    const mins = diff % 60
    setCountdown(`Prochain: Fajr dans ${hours}h ${mins}m`)
  }

  const searchCities = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setCitySuggestions([])
      return
    }

    // Clear previous timeout
    if (searchTimeout) clearTimeout(searchTimeout)

    // Debounce with 500ms delay (shorter than before for better UX)
    const newTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=fr&format=json&limit=10`,
          {
            headers: {
              'User-Agent': 'Hub-Halal-App/1.0'
            }
          }
        )
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          console.error('Nominatim returned non-JSON response (rate limited?)')
          setCitySuggestions([])
          return
        }

        const data = await response.json()
        
        if (!Array.isArray(data)) {
          setCitySuggestions([])
          return
        }

        // Filter for actual city-level results
        const suggestions: CityOption[] = data
          .filter((item: any) => item.name && item.lat && item.lon) // Just check for name and coordinates
          .map((item: any) => ({
            name: item.name, // Nominatim returns name directly
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }))
        
        // Remove duplicates by name (case-insensitive)
        const unique = Array.from(
          new Map(suggestions.map(item => [item.name.toLowerCase(), item])).values()
        )
        
        console.log('Search results for "' + query + '":', unique.slice(0, 5)) // Debug
        setCitySuggestions(unique.slice(0, 5))
      } catch (error) {
        console.error('Error searching cities:', error)
        setCitySuggestions([])
      }
    }, 500) // Reduced from 1000ms to 500ms

    setSearchTimeout(newTimeout)
  }

  const selectCity = (city: CityOption) => {
    const newLocation = {
      latitude: city.lat,
      longitude: city.lon,
      city: city.name,
    }
    setLocation(newLocation)
    // Save location to localStorage
    localStorage.setItem('halal_location', JSON.stringify(newLocation))
    fetchPrayerTimes(city.lat, city.lon)
    setShowCityModal(false)
    setCityInput('')
    setCitySuggestions([])
  }

  const getNearestCities = async () => {
    try {
      setLoading(true)
      // Use reverse geocoding to find the address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`,
        {
          headers: {
            'User-Agent': 'Hub-Halal-App/1.0'
          }
        }
      )
      const data = await response.json()
      
      if (!data.address) {
        setCitySuggestions([])
        return
      }

      // Extract city name from reverse geocoding result
      const cityName = data.address.city || data.address.town || data.address.village || location.city
      
      // Search for that city + nearby alternatives
      try {
        const searchResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&countrycodes=fr&format=json&limit=5`,
          {
            headers: {
              'User-Agent': 'Hub-Halal-App/1.0'
            }
          }
        )
        const searchData = await searchResponse.json()
        
        if (Array.isArray(searchData) && searchData.length > 0) {
          const suggestions: CityOption[] = searchData
            .filter((item: any) => item.name && (item.addresstype === 'town' || item.addresstype === 'city' || item.class === 'boundary'))
            .map((item: any) => ({
              name: item.name, // Use name directly
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }))
          
          console.log('Nearby cities:', suggestions) // Debug log
          setCitySuggestions(suggestions)
        } else {
          setCitySuggestions([])
        }
      } catch (searchError) {
        console.error('Error searching nearby cities:', searchError)
        setCitySuggestions([])
      }
    } catch (error) {
      console.error('Error getting nearby cities:', error)
      setCitySuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Get city name from reverse geocoding
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  'User-Agent': 'Hub-Halal-App/1.0'
                }
              }
            )
            const geoData = await geoResponse.json()
            const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Votre position'
            
            const newLocation = { latitude, longitude, city }
            setLocation(newLocation)
            // Save location
            localStorage.setItem('halal_location', JSON.stringify(newLocation))
            fetchPrayerTimes(latitude, longitude)
          } catch (error) {
            console.error('Error getting city name:', error)
            const newLocation = { latitude, longitude, city: 'Votre position' }
            setLocation(newLocation)
            localStorage.setItem('halal_location', JSON.stringify(newLocation))
            fetchPrayerTimes(latitude, longitude)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Paris par défaut si geolocation échoue
          const defaultLat = 48.8566
          const defaultLon = 2.3522
          const defaultLocation = { latitude: defaultLat, longitude: defaultLon, city: 'Paris (par défaut)' }
          setLocation(defaultLocation)
          localStorage.setItem('halal_location', JSON.stringify(defaultLocation))
          fetchPrayerTimes(defaultLat, defaultLon)
        }
      )
    } else {
      // Paris par défaut si geolocation n'est pas disponible
      const defaultLat = 48.8566
      const defaultLon = 2.3522
      const defaultLocation = { latitude: defaultLat, longitude: defaultLon, city: 'Paris (par défaut)' }
      setLocation(defaultLocation)
      localStorage.setItem('halal_location', JSON.stringify(defaultLocation))
      fetchPrayerTimes(defaultLat, defaultLon)
    }
  }

  const fetchPrayerTimes = async (lat: number, lng: number, method: number = settings.method) => {
    try {
      setLoading(true)
      const today = new Date()
      const date = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
      
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lng}&method=${method}`
      )
      const data = await response.json()
      
      if (data.code === 200) {
        setPrayerTimes(data.data.timings)
        // Cache today's prayers
        localStorage.setItem('halal_prayers', JSON.stringify(data.data.timings))
        localStorage.setItem('halal_prayers_date', date)
        // Reset notifications tracker for new prayers
        setNotifiedPrayers(new Set())
        setPlayedAdhanPrayers(new Set())
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error)
    } finally {
      setLoading(false)
    }
  }

  const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
    const ADHAN_URL_DEFAULT = 'https://ia601709.us.archive.org/18/items/ash-shishani-adhan/ssstik.io_1768862382181.mp3'
    const ADHAN_URL_FAJR = 'https://ia600602.us.archive.org/34/items/guantanamo_adhan/ssstik.io_1768862688567.mp3'
  
  const prayerNames: Record<string, string> = {
    Fajr: 'Fajr',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
  }

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    for (let i = 0; i < mainPrayers.length; i++) {
      const prayer = mainPrayers[i]
      const [hours, minutes] = prayerTimes[prayer as keyof PrayerTimes].split(':')
      const prayerTime = parseInt(hours) * 60 + parseInt(minutes)
      
      if (currentTime < prayerTime) {
        return i > 0 ? mainPrayers[i - 1] : mainPrayers[mainPrayers.length - 1]
      }
    }
    return mainPrayers[mainPrayers.length - 1]
  }

  const currentPrayer = getCurrentPrayer()

  const getPrayerTimeMinutes = (prayer: string) => {
    if (!prayerTimes) return null
    const [h, m] = prayerTimes[prayer as keyof PrayerTimes].split(':')
    return parseInt(h) * 60 + parseInt(m)
  }

  const computeNextPrayer = () => {
    if (!prayerTimes) return { next: null as string | null, diff: null as number | null }
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    for (const prayer of mainPrayers) {
      const t = getPrayerTimeMinutes(prayer)
      if (t !== null && t > nowMinutes) {
        return { next: prayer, diff: t - nowMinutes }
      }
    }
    // Next is Fajr tomorrow
    const fajrTime = getPrayerTimeMinutes('Fajr') || 0
    return { next: 'Fajr', diff: 24 * 60 - nowMinutes + fajrTime }
  }

  const { next: nextPrayer, diff: nextPrayerDiff } = computeNextPrayer()

  const isCurrentActive = (() => {
    if (!prayerTimes || !currentPrayer) return false
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const currentMinutes = getPrayerTimeMinutes(currentPrayer)
    if (currentMinutes === null) return false
    const since = nowMinutes - currentMinutes
    if (adhanPlaying || (since >= 0 && since <= 15)) return true
    if (duaVisibleUntil && Date.now() < duaVisibleUntil) return true
    return false
  })()

  const playTestAdhan = () => {
    if (adhanAudioRef.current) {
      const url = currentPrayer === 'Fajr' ? ADHAN_URL_FAJR : ADHAN_URL_DEFAULT
      adhanAudioRef.current.src = url
      adhanAudioRef.current.volume = adhanVolume
      adhanAudioRef.current.play()
      setAdhanPlaying(true)
      setShowAdhanControl(true)
      setAdhanProgress(0)
      setAdhanCurrentTime(0)
      setAdhanDuration(adhanAudioRef.current.duration || 0)
      setDuaVisibleUntil(null)
    }
  }

  const playAdhanSound = () => {
    // For when we need to play again (replay button)
    if (adhanAudioRef.current) {
      adhanAudioRef.current.currentTime = 0
      adhanAudioRef.current.play()
      setAdhanCurrentTime(0)
      setAdhanProgress(0)
    }
  }

  const stopAdhan = () => {
    if (adhanAudioRef.current) {
      adhanAudioRef.current.pause()
      adhanAudioRef.current.currentTime = 0
    }
    setAdhanPlaying(false)
    setAdhanProgress(0)
    setAdhanCurrentTime(0)
    setAdhanDuration(0)
    setShowAdhanControl(false)
    setDuaVisibleUntil(Date.now() + 10 * 60 * 1000)
  }

  const toggleAdhanPlayPause = () => {
    if (adhanAudioRef.current) {
      if (adhanPlaying) {
        adhanAudioRef.current.pause()
        setAdhanPlaying(false)
      } else {
        adhanAudioRef.current.play()
        setAdhanPlaying(true)
      }
    }
  }

  useEffect(() => {
    if (adhanAudioRef.current) {
      adhanAudioRef.current.volume = adhanVolume
    }
  }, [adhanVolume])

  useEffect(() => {
    const audio = adhanAudioRef.current
    if (!audio) return

    const handleTime = () => {
      const duration = audio.duration && !isNaN(audio.duration) ? audio.duration : 0
      const current = duration ? Math.min(duration, audio.currentTime) : audio.currentTime || 0
      setAdhanDuration(duration)
      setAdhanCurrentTime(Math.max(0, current))
      setAdhanProgress(duration ? Math.min(1, current / duration) : 0)
    }

    const handleEnded = () => {
      setAdhanPlaying(false)
      setAdhanProgress(1)
      setAdhanCurrentTime(audio.duration && !isNaN(audio.duration) ? audio.duration : 0)
      setAdhanDuration(audio.duration && !isNaN(audio.duration) ? audio.duration : 0)
      setShowAdhanControl(false)
      setDuaVisibleUntil(Date.now() + 10 * 60 * 1000)
    }

    const handleLoaded = () => {
      setAdhanProgress(0)
      setAdhanCurrentTime(0)
      setAdhanDuration(audio.duration && !isNaN(audio.duration) ? audio.duration : 0)
    }

    audio.addEventListener('timeupdate', handleTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoaded)

    return () => {
      audio.removeEventListener('timeupdate', handleTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoaded)
    }
  }, [])

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-islamic-primary dark:text-islamic-accent mb-2">
              Horaires de prières
            </h1>
            <AlternatingDate className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin size={20} />
                <span className="font-medium">{location.city}</span>
              </div>
              <button
                onClick={() => {
                  setShowCityModal(true)
                  setTimeout(() => getNearestCities(), 100)
                }}
                className="px-3 py-1 text-sm bg-islamic-accent hover:bg-islamic-primary text-white rounded-md transition-colors flex items-center gap-1"
              >
                <Edit2 size={14} />
                Changer
              </button>
              {showTestFeatures && (
                <button
                  onClick={playTestAdhan}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-1"
                >
                  <Bell size={14} />
                  Test Adhan
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow text-gray-700 dark:text-gray-300"
          >
            <SettingsIcon size={20} />
            <span>Paramètres</span>
          </button>
        </div>

        {/* Next Prayer Countdown - Prominent Display */}
        {countdown && (
          <div className="mb-6 bg-gradient-to-r from-islamic-primary to-islamic-accent dark:from-islamic-accent dark:to-islamic-primary rounded-xl shadow-lg p-6 text-center">
            <div className="flex items-center justify-center gap-3 text-white">
              <Clock size={32} />
              <span className="text-3xl font-bold">{countdown}</span>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-lg text-islamic-primary dark:text-islamic-accent mb-4">
              Paramètres de prière
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Méthode de calcul
                </label>
                <select
                  value={settings.method}
                  onChange={(e) => {
                    const newMethod = parseInt(e.target.value)
                    const newSettings = { ...settings, method: newMethod }
                    setSettings(newSettings)
                    // Save to localStorage
                    localStorage.setItem('halal_prayer_settings', JSON.stringify(newSettings))
                    // Fetch new prayers with new method
                    fetchPrayerTimes(location.latitude, location.longitude, newMethod)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="1">University of Islamic Sciences, Karachi</option>
                  <option value="2">Islamic Society of North America (ISNA) - 15°</option>
                  <option value="3">Muslim World League (MWL) - 18°</option>
                  <option value="4">Umm Al-Qura University, Makkah</option>
                  <option value="5">Egyptian General Authority of Survey - 19.5°</option>
                  <option value="7">Institute of Geophysics, University of Tehran - 17.7°</option>
                  <option value="12">Union Organization Islamic de France (UOIF) - 12°</option>
                  <option value="13">Majlis Ugama Islam Singapura, Singapore</option>
                  <option value="15">Moonsighting Committee Worldwide</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pour la France: UOIF (Musulmans de France) recommandé - 12° angle Fajr
                </p>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => {
                    const newSettings = { ...settings, notifications: e.target.checked }
                    setSettings(newSettings)
                    // Save to localStorage
                    localStorage.setItem('halal_prayer_settings', JSON.stringify(newSettings))
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Recevoir des rappels de prières</span>
              </label>

              {/* Test notification button */}
              <button
                onClick={() => sendTestNotification()}
                className="w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                🔔 Tester une notification
              </button>

              {/* Adhan file upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adhan personnalisé (optionnel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const audioDataUrl = event.target?.result as string
                          const newSettings = { ...settings, adhanFile: audioDataUrl }
                          setSettings(newSettings)
                          localStorage.setItem('halal_prayer_settings', JSON.stringify(newSettings))
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="flex-1 px-4 py-2 text-sm"
                  />
                  {settings.adhanFile && (
                    <button
                      onClick={() => {
                        const newSettings = { ...settings, adhanFile: undefined }
                        setSettings(newSettings)
                        localStorage.setItem('halal_prayer_settings', JSON.stringify(newSettings))
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:opacity-90"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {settings.adhanFile ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Adhan personnalisé chargé</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">L'Adhan par défaut sera utilisé</p>
                )}
              </div>

              <button
                onClick={getLocation}
                className="w-full px-4 py-2 bg-islamic-primary dark:bg-islamic-accent text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Rafraîchir la localisation
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-islamic-accent border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des horaires...</p>
          </div>
        ) : prayerTimes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {mainPrayers.map((prayer) => {
              const isCurrent = prayer === currentPrayer
              const isActive = isCurrent && isCurrentActive
              const isNext = !isActive && prayer === nextPrayer
              const nextDiffText = isNext && nextPrayerDiff !== null ? (() => {
                const h = Math.floor(nextPrayerDiff! / 60)
                const m = nextPrayerDiff! % 60
                return h > 0 ? `${h}h ${m}m` : `${m}m`
              })() : ''

              return (
                <div
                  key={prayer}
                  className={`rounded-xl shadow-sm p-6 text-center transition-all ${
                    isActive
                      ? 'bg-islamic-accent text-white scale-105 shadow-lg'
                      : isNext
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {isActive && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Bell size={16} />
                      <span className="text-xs font-semibold">MAINTENANT</span>
                      {adhanPlaying && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 animate-pulse">
                          ADHAN
                        </span>
                      )}
                    </div>
                  )}
                  {isNext && (
                    <div className="mb-2 text-xs font-semibold text-amber-700 dark:text-amber-200">Prochaine</div>
                  )}
                  <h3 className={`font-semibold mb-2 ${isActive ? 'text-white' : isNext ? 'text-amber-800 dark:text-amber-100' : 'text-islamic-primary dark:text-islamic-accent'}`}>
                    {prayerNames[prayer]}
                  </h3>
                  <div className="text-3xl font-bold">
                    {prayerTimes[prayer as keyof PrayerTimes]}
                  </div>
                  {isNext && nextDiffText && (
                    <div className="mt-2 text-xs text-amber-700 dark:text-amber-200">dans {nextDiffText}</div>
                  )}
                </div>
                )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <p className="text-gray-600 dark:text-gray-400">Impossible de charger les horaires</p>
            <button
              onClick={getLocation}
              className="mt-4 px-6 py-2 bg-islamic-primary dark:bg-islamic-accent text-white rounded-lg hover:opacity-90"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* City Selection Modal */}
        {showCityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">
                  Changer de ville
                </h3>
                <button
                  onClick={() => {
                    setShowCityModal(false)
                    setCityInput('')
                    setCitySuggestions([])
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setModalTab('manual')}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    modalTab === 'manual'
                      ? 'text-islamic-accent border-b-2 border-islamic-accent'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Recherche
                </button>
                <button
                  onClick={() => {
                    setModalTab('nearby')
                    getNearestCities()
                  }}
                  className={`flex-1 px-4 py-3 font-medium transition-colors ${
                    modalTab === 'nearby'
                      ? 'text-islamic-accent border-b-2 border-islamic-accent'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  À proximité
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {modalTab === 'manual' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Entrez le nom d'une ville
                      </label>
                      <input
                        type="text"
                        placeholder="Paris, Lyon, Marseille..."
                        value={cityInput}
                        onChange={(e) => {
                          setCityInput(e.target.value)
                          searchCities(e.target.value)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-islamic-accent"
                        autoFocus
                      />
                    </div>

                    {citySuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {citySuggestions.map((city, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectCity(city)}
                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-islamic-light dark:hover:bg-gray-700 transition-colors"
                          >
                            <p className="font-medium text-gray-900 dark:text-gray-100">{city.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {city.lat.toFixed(4)}°, {city.lon.toFixed(4)}°
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : cityInput.length >= 2 ? (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Aucune ville trouvée
                      </p>
                    ) : (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Tapez au moins 2 caractères
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {citySuggestions.length > 0 ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Villes à proximité de votre localisation
                        </p>
                        {citySuggestions.map((city, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectCity(city)}
                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-islamic-light dark:hover:bg-gray-700 transition-colors"
                          >
                            <p className="font-medium text-gray-900 dark:text-gray-100">{city.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {city.lat.toFixed(4)}°, {city.lon.toFixed(4)}°
                            </p>
                          </button>
                        ))}
                      </>
                    ) : (
                      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Chargement des villes à proximité...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden audio element for adhan */}
      <audio ref={adhanAudioRef} />

      {/* Adhan Control Popup */}
      {showAdhanControl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">
                🔊 Contrôle Adhan
              </h3>
              <button
                onClick={() => {
                  stopAdhan()
                  setShowAdhanControl(false)
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={toggleAdhanPlayPause}
                  className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
                    adhanPlaying
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {adhanPlaying ? <Pause size={20} /> : <Play size={20} />}
                  {adhanPlaying ? 'Pause' : 'Lecture'}
                </button>
                <button
                  onClick={() => {
                    stopAdhan()
                    setShowAdhanControl(false)
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white transition-colors"
                >
                  Arrêter
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                  <span>Progression</span>
                  <span>
                    {formatTime(adhanCurrentTime)} / {formatTime(adhanDuration)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-islamic-accent transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, adhanProgress * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Volume2 size={16} className="inline mr-2" />
                  Volume: {Math.round(adhanVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={adhanVolume}
                  onChange={(e) => setAdhanVolume(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Le volume est réglé bas par défaut pour éviter les interruptions. La fenêtre se fermera automatiquement à la fin de l'adhan.
              </p>
            </div>
          </div>
        </div>
      )}

      {duaVisibleUntil && Date.now() < duaVisibleUntil && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-islamic-light dark:border-gray-700">
          <p className="text-sm font-semibold text-islamic-primary dark:text-islamic-accent mb-2">Invocation après l'Adhan</p>
          <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            <p>D’après Jabir le Prophète صلى الله عليه وسلم a dit :</p>
            <p className="italic text-gray-700 dark:text-gray-300">« Celui qui après avoir entendu l’appel à la prière prononce cette formule : »</p>
            <p><strong>Français :</strong> « Ô mon Dieu ! Seigneur de cet appel parfait et de cette prière que l’on va accomplir, donne à Muhammad la place éminente (Al wassila) et la supériorité, envoie-le au poste glorieux que Tu lui as promis ».</p>
            <p><strong>Phonétique :</strong> Allâhumma Rabba hâdhihi dda’wati ttâmati, wa ssalâtil qâ°imati. Âti Muhammadan al wasîlata wal fadîlata, wa b’ath-hu maqâman mahmûdan alladhî wa ‘adtahu.</p>
            <p><strong>Arabe :</strong> اللّهُـمَّ رَبَّ هَذِهِ الدّعْـوَةِ التّـامَّة وَالصّلاةِ القَـائِمَة آتِ محَـمَّداً الوَسيـلةَ وَالْفَضـيلَة وَابْعَـثْه مَقـامـاً مَحـموداً الَّذي وَعَـدْتَه</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Celui-là mon intercession lui sera acquise le jour de la résurrection (Boukhari).</p>
          </div>
        </div>
      )}
    </div>
  )
}
