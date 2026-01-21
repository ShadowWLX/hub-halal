import React from 'react'
import { Home, BookOpen, Clock, Music, Settings, Moon, Sun, LogOut } from 'lucide-react'

type Page = 'dashboard' | 'quran' | 'prayers' | 'hadith' | 'media' | 'settings'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
  darkMode: boolean
  onToggleDarkMode: () => void
  onLogout: () => void
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  darkMode, 
  onToggleDarkMode,
  onLogout 
}) => {
  const navItems: Array<{ id: Page; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Accueil', icon: <Home size={24} /> },
    { id: 'quran', label: 'Coran', icon: <BookOpen size={24} /> },
    { id: 'prayers', label: 'Prières', icon: <Clock size={24} /> },
    { id: 'hadith', label: 'Hadith', icon: <BookOpen size={24} /> },
    { id: 'media', label: 'Média', icon: <Music size={24} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={24} /> },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-islamic-primary dark:text-islamic-accent">Hub Halal</h1>
        
        <div className="flex gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-islamic-primary dark:bg-islamic-accent text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
