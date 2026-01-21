import path from 'path'
import { app } from 'electron'
import fs from 'fs'

interface User {
  id: number
  username: string
  email: string
  password: string
  created_at: string
}

interface Settings {
  id: number
  user_id: number
  language: string
  theme: string
  madhab: string
  prayer_method: string
  show_tajweed: boolean
  show_translation: boolean
  show_transliteration: boolean
  font_size: number
  notification_enabled: boolean
  location_latitude?: number
  location_longitude?: number
  location_name?: string
  created_at: string
  updated_at: string
}

let dataPath: string
let users: User[] = []
let settings: Settings[] = []
let nextUserId = 1
let nextSettingsId = 1

export const initializeDatabase = async () => {
  dataPath = path.join(app.getPath('userData'), 'data')
  
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
  }

  const usersPath = path.join(dataPath, 'users.json')
  const settingsPath = path.join(dataPath, 'settings.json')

  // Load existing data
  if (fs.existsSync(usersPath)) {
    const data = fs.readFileSync(usersPath, 'utf-8')
    users = JSON.parse(data)
    nextUserId = Math.max(...users.map(u => u.id), 0) + 1
  }

  if (fs.existsSync(settingsPath)) {
    const data = fs.readFileSync(settingsPath, 'utf-8')
    settings = JSON.parse(data)
    nextSettingsId = Math.max(...settings.map(s => s.id), 0) + 1
  }

  console.log('Database initialized at:', dataPath)
}

const saveUsers = () => {
  const usersPath = path.join(dataPath, 'users.json')
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
}

const saveSettings = () => {
  const settingsPath = path.join(dataPath, 'settings.json')
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
}

export const getDatabase = () => ({
  createUser: (username: string, email: string, password: string) => {
    if (users.some(u => u.email === email)) {
      throw new Error('Email already exists')
    }
    const user: User = {
      id: nextUserId++,
      username,
      email,
      password,
      created_at: new Date().toISOString(),
    }
    users.push(user)
    saveUsers()
    
    // Create default settings
    const userSettings: Settings = {
      id: nextSettingsId++,
      user_id: user.id,
      language: 'fr',
      theme: 'light',
      madhab: 'shafi',
      prayer_method: 'mwl',
      show_tajweed: true,
      show_translation: true,
      show_transliteration: false,
      font_size: 16,
      notification_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    settings.push(userSettings)
    saveSettings()
    
    return user
  },

  findUserByEmail: (email: string) => {
    return users.find(u => u.email === email)
  },

  getSettings: (userId: number) => {
    return settings.find(s => s.user_id === userId)
  },

  updateSettings: (userId: number, updates: any) => {
    const setting = settings.find(s => s.user_id === userId)
    if (setting) {
      Object.assign(setting, updates, { updated_at: new Date().toISOString() })
      saveSettings()
    }
  },
})
