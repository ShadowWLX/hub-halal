import { useState, useEffect } from 'react'

interface DateDisplayProps {
  className?: string
}

// Hijri calendar calculation - accurate conversion
const toHijri = (date: Date): { day: number; month: string; year: number } => {
  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
    'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'
  ]
  
  const g_d = date.getDate()
  const g_m = date.getMonth() + 1
  const g_y = date.getFullYear()
  
  // Convert to Hijri using Islamic calendar algorithm
  let h_y, h_m, h_d
  
  // Calculate Julian Day Number
  const a = Math.floor((14 - g_m) / 12)
  const y = g_y + 4800 - a
  const m = g_m + 12 * a - 3
  
  const jdn = g_d + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  
  // Convert JDN to Hijri
  const n = jdn - 1948439.5
  const q = Math.floor(n / 10631)
  const r = Math.floor(n % 10631)
  
  const a2 = Math.floor(r / 354.36667)
  const w = Math.floor(r % 354.36667)
  
  const q2 = Math.floor(w / 29.5001)
  const q3 = Math.floor(w % 29.5001)
  
  h_y = Math.floor(30 * q + a2 + Math.floor(q2 / 11) + 1)
  h_m = Math.floor(((q2 + 1) % 12) === 0 ? 12 : ((q2 + 1) % 12))
  h_d = Math.floor(q3) + 1
  
  if (h_d > 30) {
    h_d = 1
    h_m += 1
    if (h_m > 12) {
      h_m = 1
      h_y += 1
    }
  }
  
  return {
    day: h_d,
    month: hijriMonths[h_m - 1],
    year: h_y
  }
}

const formatGregorian = (date: Date): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export const AlternatingDate: React.FC<DateDisplayProps> = ({ className = '' }) => {
  const [showHijri, setShowHijri] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  useEffect(() => {
    // Update date every minute
    const dateTimer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)
    
    // Alternate display every 10 seconds
    const displayTimer = setInterval(() => {
      setShowHijri(prev => !prev)
    }, 10000)
    
    return () => {
      clearInterval(dateTimer)
      clearInterval(displayTimer)
    }
  }, [])
  
  const hijri = toHijri(currentDate)
  const gregorian = formatGregorian(currentDate)
  
  return (
    <div className={`transition-opacity duration-500 ${className}`}>
      {showHijri ? (
        <span>{hijri.day} {hijri.month} {hijri.year}</span>
      ) : (
        <span>{gregorian}</span>
      )}
    </div>
  )
}
