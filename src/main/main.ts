import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import { initializeDatabase } from './database'
import { setupIpcHandlers } from './ipc'

// Add isQuitting property to app
declare global {
  namespace NodeJS {
    interface Global {
      app: any
    }
  }
}
(app as any).isQuitting = false

const isReleaseBuild = app.isPackaged || process.env.BUILD_ENV === 'release' || process.env.NODE_ENV === 'production'
const isDev = !isReleaseBuild

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Allow autoplay of audio without user gesture (needed for Adhan)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../public/icon.ico'),
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}`

  mainWindow.loadURL(startUrl)

  // Configure auto-updater
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  // Handle window close - minimize to tray instead of exiting
  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const createTray = () => {
  try {
    const iconPath = path.join(__dirname, '../../public/icon.ico')
    const fs = require('fs')
    
    // Try to load icon, create a simple one with nativeImage if it fails
    let icon
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath)
    } else {
      // Create empty image - will still be functional
      icon = nativeImage.createEmpty()
    }
    
    tray = new Tray(icon)
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Afficher Hub Halal',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          } else {
            createWindow()
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quitter',
        click: () => {
          (app as any).isQuitting = true
          app.quit()
        }
      }
    ])
    
    tray.setContextMenu(contextMenu)
    tray.setToolTip('Hub Halal - Clic droit pour menu')
    
    // Double click on tray icon to open
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      } else {
        createWindow()
      }
    })
    
    // Single click to show window (Windows behavior)
    tray.on('click', () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide()
      } else if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      } else {
        createWindow()
      }
    })
  } catch (error) {
    console.error('Failed to create tray:', error)
    // Don't let tray error crash the app
  }
}

const createMenu = () => {
  // Enlever la barre de menu par défaut
  Menu.setApplicationMenu(null)
}

app.on('ready', async () => {
  await initializeDatabase()
  setupIpcHandlers()
  createWindow()
  createMenu()
  createTray()
  
  // Set auto-start on Windows
  if (!isDev) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    })
  }
})

app.on('window-all-closed', () => {
  // Don't quit on window close - app stays in tray
  // Only quit when user clicks "Quitter" in tray menu
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
