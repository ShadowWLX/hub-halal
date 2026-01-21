import React, { useState, useEffect } from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'

interface SettingsPageProps {
  userId: number
  onLogout: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userId, onLogout, darkMode, onToggleDarkMode }) => {
  const [settings, setSettings] = useState({
    language: 'fr',
    notification_enabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await window.electron.settingsGet(userId)
      if (result.success && result.settings) {
        setSettings({ ...settings, ...result.settings })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = async () => {
    try {
      await window.electron.settingsUpdate({
        userId,
        updates: settings,
      })
      alert('Paramètres sauvegardés!')
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-islamic-primary dark:text-islamic-accent mb-8">Paramètres globaux</h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          {/* Dark Mode */}
          <div>
            <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2">Thème</label>
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-3 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100"
            >
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              <span>{darkMode ? 'Mode sombre' : 'Mode clair'}</span>
            </button>
          </div>

          {/* Language */}
          <div>
            <label className="block font-semibold text-gray-900 dark:text-gray-100 mb-2">Langue de l'application</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-islamic-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choisissez la langue de l'interface
            </p>
          </div>

          {/* Notifications */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notification_enabled}
                onChange={(e) => handleSettingChange('notification_enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Activer les notifications</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">
              Recevez des notifications pour les horaires de prières
            </p>
          </div>

          {/* Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> Les paramètres spécifiques (Coran, Prières) sont disponibles dans chaque onglet.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSave}
            className="bg-islamic-primary dark:bg-islamic-accent text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90"
          >
            Sauvegarder
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-500 text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 ml-auto"
          >
            <LogOut size={20} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
