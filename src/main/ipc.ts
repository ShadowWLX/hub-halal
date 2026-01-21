import { ipcMain } from 'electron'
import { getDatabase } from './database'

export const setupIpcHandlers = () => {
  const db = getDatabase()

  // User handlers
  ipcMain.handle('user:create', (_event, { username, email, password }) => {
    try {
      const user = db.createUser(username, email, password)
      return { success: true, userId: user.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('user:login', (_event, { email, password }) => {
    try {
      const user = db.findUserByEmail(email)
      if (user && user.password === password) {
        return { success: true, user }
      }
      return { success: false, error: 'Invalid credentials' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Settings handlers
  ipcMain.handle('settings:get', (_event, userId) => {
    try {
      const settings = db.getSettings(userId)
      return { success: true, settings }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('settings:update', (_event, { userId, updates }) => {
    try {
      db.updateSettings(userId, updates)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
