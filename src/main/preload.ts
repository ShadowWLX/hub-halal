import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // User
  userCreate: (data: any) => ipcRenderer.invoke('user:create', data),
  userLogin: (data: any) => ipcRenderer.invoke('user:login', data),
  
  // Settings
  settingsGet: (userId: number) => ipcRenderer.invoke('settings:get', userId),
  settingsUpdate: (data: any) => ipcRenderer.invoke('settings:update', data),
}

contextBridge.exposeInMainWorld('electron', electronAPI)

declare global {
  interface Window {
    electron: typeof electronAPI
  }
}

export type ElectronAPI = typeof electronAPI
