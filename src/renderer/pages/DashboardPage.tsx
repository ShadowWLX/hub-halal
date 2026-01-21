import React, { useEffect, useState } from 'react'
import { BookOpen, Clock } from 'lucide-react'
import { AlternatingDate } from '../components/AlternatingDate'

interface DashboardPageProps {
  onOpenSurah?: (surahNumber: number) => void
}

interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Sunset: string
  Maghrib: string
  Isha: string
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenSurah }) => {
  const [nextInfo, setNextInfo] = useState<string>('')
  const [suggestedSurah, setSuggestedSurah] = useState<number>(1)
  const [hadith, setHadith] = useState<string>('')

  useEffect(() => {
    // Hadiths FR simples (placeholder) - un par jour selon la date
    const hadiths = [
      "Les actes ne valent que par leurs intentions – Bukhari & Muslim.",
      "Le meilleur d’entre vous est celui qui apprend le Coran et l’enseigne – Bukhari.",
      "La prière est la clé du paradis – Ahmad.",
      "Celui qui croit en Allah et au Jour dernier, qu’il dise du bien ou se taise – Bukhari & Muslim.",
      "La miséricorde n’est retirée que du cœur des malheureux – Tirmidhi."
    ]
    const dayIndex = new Date().getDate() % hadiths.length
    setHadith(hadiths[dayIndex])

    // Suggest surah by day (cycling through 114)
    const surahNumber = (new Date().getDate() % 114) + 1
    setSuggestedSurah(surahNumber)

    // Next prayer information from cached timings
    const cached = localStorage.getItem('halal_prayers')
    if (cached) {
      try {
        const timings: PrayerTimes = JSON.parse(cached)
        const mainPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        for (const p of mainPrayers) {
          const [h, m] = timings[p].split(':')
          const minutes = parseInt(h) * 60 + parseInt(m)
          if (minutes > currentMinutes) {
            const diff = minutes - currentMinutes
            const hours = Math.floor(diff / 60)
            const mins = diff % 60
            setNextInfo(`Prochaine prière: ${p} dans ${hours}h ${mins}m`)
            return
          }
        }
        setNextInfo('Prochaine prière: Fajr demain')
      } catch {
        setNextInfo('Horaires non disponibles')
      }
    } else {
      setNextInfo('Horaires non disponibles')
    }
  }, [])

  const openSurah = () => {
    localStorage.setItem('surah_to_open', suggestedSurah.toString())
    if (onOpenSurah) onOpenSurah(suggestedSurah)
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-auto">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent mb-3 flex items-center gap-2">
            <Clock size={20} /> Tableau de bord
          </h2>
          <AlternatingDate className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{nextInfo}</p>
          <div className="mt-4">
            <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Sourate recommandée</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-islamic-primary dark:bg-islamic-accent text-white flex items-center justify-center font-bold">
                {suggestedSurah}
              </div>
              <button onClick={openSurah} className="px-4 py-2 rounded-md bg-islamic-accent hover:bg-islamic-primary text-white flex items-center gap-2">
                <BookOpen size={18} /> Lire la sourate
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent mb-3">Hadith du jour</h2>
          <p className="text-gray-700 dark:text-gray-300 italic">“{hadith}”</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
