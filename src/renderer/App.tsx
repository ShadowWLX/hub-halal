import React, { useState, useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { QuranPage } from './pages/QuranPage'
import { DashboardPage } from './pages/DashboardPage'
import { PrayersPage } from './pages/PrayersPage'
import { HadithPage } from './pages/HadithPage'
import { MediaPage } from './pages/MediaPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthPage } from './pages/AuthPage'
import './styles/globals.css'

type Page = 'dashboard' | 'quran' | 'prayers' | 'hadith' | 'media' | 'settings'

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [darkMode, setDarkMode] = useState(true) // Dark mode par défaut

  useEffect(() => {
    // Check saved user
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(parseInt(storedUserId))
      setIsAuthenticated(true)
    }

    // Check dark mode preference
    const storedDarkMode = localStorage.getItem('darkMode')
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === 'true')
    }
  }, [])

  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  const handleLogin = (id: number) => {
    setUserId(id)
    setIsAuthenticated(true)
    localStorage.setItem('userId', id.toString())
  }

  const handleLogout = () => {
    setUserId(null)
    setIsAuthenticated(false)
    localStorage.removeItem('userId')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-hidden">
        {currentPage === 'dashboard' && <DashboardPage onOpenSurah={(n) => setCurrentPage('quran')} />}
        {currentPage === 'quran' && <QuranPage userId={userId!} />}
        {currentPage === 'prayers' && <PrayersPage userId={userId!} />}
        {currentPage === 'hadith' && <HadithPage />}
        {currentPage === 'media' && <MediaPage userId={userId!} />}
        {currentPage === 'settings' && (
          <SettingsPage userId={userId!} onLogout={handleLogout} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
        )}
      </main>
    </div>
  )
}

export default App
