// Notification Service for Prayer Time Alerts
// Supports Windows notifications + Adhan audio

interface NotificationSettings {
  enabled: boolean
  adhanFile?: string // Path to custom adhan audio file
  minutesBefore: number // Alert X minutes before prayer
}

interface PrayerNotification {
  prayer: string
  time: string
  latitude: number
  longitude: number
}

// Get saved notification settings
export const getNotificationSettings = (): NotificationSettings => {
  const saved = localStorage.getItem('halal_notification_settings')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return getDefaultSettings()
    }
  }
  return getDefaultSettings()
}

// Save notification settings
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem('halal_notification_settings', JSON.stringify(settings))
}

// Get default settings
const getDefaultSettings = (): NotificationSettings => ({
  enabled: true,
  minutesBefore: 5, // Alert 5 minutes before
  adhanFile: undefined, // Will use default
})

// Request notification permission (for Windows)
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

// Show prayer time notification
export const showPrayerNotification = async (prayer: string, time: string, adhanFile?: string): Promise<void> => {
  const settings = getNotificationSettings()
  
  if (!settings.enabled) return

  // Request permission first
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  // Show Windows notification
  try {
    const notification = new Notification(`🕌 Prière: ${prayer}`, {
      body: `Il est ${time} - C'est l'heure de la prière de ${prayer}`,
      icon: '/islamic-icon.png',
      tag: `prayer-${prayer}`,
      requireInteraction: false,
    })

    // Play Adhan audio (use custom if provided, otherwise default)
    playAdhan(adhanFile || settings.adhanFile)

    // Auto-close notification after 10 seconds
    setTimeout(() => notification.close(), 10000)
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

// Play Adhan audio
export const playAdhan = (customAdhanPath?: string): void => {
  try {
    // Use a persistent hidden audio element to improve autoplay reliability
    let audio = document.getElementById('adhan-audio') as HTMLAudioElement | null
    if (!audio) {
      audio = document.createElement('audio')
      audio.id = 'adhan-audio'
      audio.hidden = true
      audio.preload = 'auto'
      audio.autoplay = false
      audio.controls = false
      audio.setAttribute('playsinline', 'true')
      audio.crossOrigin = 'anonymous'
      document.body.appendChild(audio)
    }

    // Select source: custom data/blob URL or default CDN
    audio.src = customAdhanPath || 'https://cdn.islamic.network/quran/audio/adhan/ar.mp3'
    audio.volume = 0.8

    const tryPlay = () => audio!.play().catch(err => {
      // Retry once with slight delay if initial play fails
      setTimeout(() => {
        audio!.play().catch(error => {
          console.error('Adhan playback failed:', error)
        })
      }, 100)
    })

    // If already loading, wait metadata then play
    if (audio.readyState < 2) {
      audio.onloadedmetadata = () => tryPlay()
      audio.load()
    } else {
      tryPlay()
    }
  } catch (error) {
    console.error('Error setting up adhan audio:', error)
  }
}

// Stop any playing adhan
export const stopAdhan = (): void => {
  try {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      if (audio.src.includes('adhan')) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  } catch (error) {
    console.error('Error stopping adhan:', error)
  }
}

// Format time for display (HH:MM)
export const formatTimeForNotification = (hours: number, minutes: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Get time difference in minutes between now and target time
export const getTimeUntilPrayer = (prayerTimeStr: string): number => {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const [hours, minutes] = prayerTimeStr.split(':').map(Number)
  const prayerMinutes = hours * 60 + minutes
  
  return prayerMinutes - currentMinutes
}

// Check if it's time to notify (within the alert window)
export const shouldNotifyForPrayer = (prayerTimeStr: string, minutesBefore: number = 5): boolean => {
  const minutesUntil = getTimeUntilPrayer(prayerTimeStr)
  
  // Notify if within the alert window (5 minutes before)
  return minutesUntil <= minutesBefore && minutesUntil > 0
}

// Test notification (for settings)
export const sendTestNotification = async (): Promise<void> => {
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return

  try {
    new Notification('Test Notification', {
      body: 'Ceci est une notification de test. Les notifications de prière fonctionnent correctement!',
      icon: '/islamic-icon.png',
    })
  } catch (error) {
    console.error('Error sending test notification:', error)
  }
}
