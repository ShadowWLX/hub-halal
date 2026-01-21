import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Plus, Trash2, Music, SkipForward, SkipBack } from 'lucide-react'
import { getChapterRecitation, getReciters, getChapters } from '../services/quranApi'

interface Recitation {
  id: string
  reciterId: number
  chapterNumber: number
  title: string
  reciter: string
  duration: string
  url?: string
}

interface PlaylistItem {
  id: string
  recitationId: string
  recitation: Recitation
}

interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
}

export const MediaPage: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [recitations, setRecitations] = useState<Recitation[]>([])
  const [reciters, setReciters] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedReciterId, setSelectedReciterId] = useState<number | null>(null)
  const [volume, setVolume] = useState<number>(0.9)
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedOutputId, setSelectedOutputId] = useState<string>('')
  const [nowPlaying, setNowPlaying] = useState<Recitation | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load reciters, chapters and ALL 114 surahs with full audio from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [recitersList, chaptersList] = await Promise.all([
          getReciters(),
          getChapters(),
        ])
        console.log('Reciters list:', recitersList)
        console.log('Chapters count:', chaptersList.length)

        // Map chapters by chapter_number for quick lookup
        const chaptersMap = new Map<number, any>()
        chaptersList.forEach((c: any) => {
          if (c.chapter_number) chaptersMap.set(c.chapter_number, c)
          else if (c.id) chaptersMap.set(c.id, c)
        })

        // Fetch surah names from AlQuran Cloud (used for labels if API gives <114)
        let fallbackSurahNames: any[] = []
        try {
          const res = await fetch('https://api.alquran.cloud/v1/surah')
          const data = await res.json()
          fallbackSurahNames = data.data || []
        } catch (e) {
          console.warn('Could not fetch fallback surah names:', e)
        }
        
        setReciters(recitersList)
        setChapters(chaptersList)

        // Determine initial reciter
        const savedReciter = localStorage.getItem('selected_reciter_id')
        const initialReciterId = savedReciter ? parseInt(savedReciter) : (recitersList[0]?.id || 7)
        setSelectedReciterId(initialReciterId)

        await loadRecitationsForReciter(initialReciterId, recitersList[0]?.name || 'Default', chaptersMap, fallbackSurahNames)
      } catch (error) {
        console.error('Error loading media data:', error)
        loadMockRecitations()
      } finally {
        setLoading(false)
      }
    }

    const loadMockRecitations = async () => {
      console.log('Loading fallback recitations from CDN with surah names from AlQuran Cloud')
      
      // Fetch surah names from AlQuran Cloud
      let surahNames: any[] = []
      try {
        const res = await fetch('https://api.alquran.cloud/v1/surah')
        const data = await res.json()
        surahNames = data.data || []
      } catch (e) {
        console.warn('Could not fetch surah names:', e)
      }
      
      // Fallback: build full 114 surah list using CDN mapping
      const all: Recitation[] = Array.from({ length: 114 }, (_, i) => {
        const num = i + 1
        const surah = surahNames.find((s: any) => s.number === num)
        return {
          id: `surah-${num}`,
          reciterId: 1,
          chapterNumber: num,
          title: surah ? `${num}. ${surah.englishName} (${surah.name})` : `Sourate ${num}`,
          reciter: 'Mishari Rashid Al-Afasy',
          duration: '—',
          url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${num}.mp3`
        }
      })
      setRecitations(all)
      console.log(`Loaded ${all.length} surahs from CDN fallback`)
    }

    loadData()
  }, [])

  // Enumerate audio output devices (if supported)
  useEffect(() => {
    const initOutputs = async () => {
      try {
        const audio = audioRef.current
        const canSetSink = !!(audio && 'setSinkId' in audio)
        if (!canSetSink || !navigator.mediaDevices?.enumerateDevices) return
        const devices = await navigator.mediaDevices.enumerateDevices()
        const outs = devices.filter(d => d.kind === 'audiooutput')
        setOutputDevices(outs)
      } catch (e) {
        // Silently ignore
      }
    }
    initOutputs()
  }, [])

  const loadRecitationsForReciter = async (
    reciterId: number,
    reciterName: string,
    chaptersMap: Map<number, any>,
    fallbackSurahNames: any[]
  ) => {
    console.log(`Loading all 114 surahs with reciter: ${reciterName} (ID: ${reciterId})`)
    const recitationPromises: Promise<Recitation | null>[] = []

    for (let chapterNum = 1; chapterNum <= 114; chapterNum++) {
      const chapter = chaptersMap.get(chapterNum)
      const fallbackName = fallbackSurahNames.find((s: any) => s.number === chapterNum)
      const title = chapter
        ? `${chapterNum}. ${chapter.name_simple || chapter.name_complex || 'Sourate'} (${chapter.name_arabic || ''})`
        : fallbackName
          ? `${chapterNum}. ${fallbackName.englishName} (${fallbackName.name})`
          : `Sourate ${chapterNum}`

      const hasChapterMeta = chaptersMap.has(chapterNum)

      recitationPromises.push(
        (async () => {
          const audioFile = hasChapterMeta
            ? await getChapterRecitation(reciterId, chapterNum, { quiet: true })
            : null
          if (audioFile?.url) {
            return {
              id: `${reciterId}-${chapterNum}`,
              reciterId,
              chapterNumber: chapterNum,
              title,
              reciter: reciterName || 'Unknown',
              duration: formatDuration(audioFile.duration || 0),
              url: audioFile.url
            }
          }
          return {
            id: `cdn-${chapterNum}`,
            reciterId: 1,
            chapterNumber: chapterNum,
            title,
            reciter: 'Mishari Rashid Al-Afasy',
            duration: '—',
            url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${chapterNum}.mp3`
          }
        })()
      )
    }

    const loadedRecitations = await Promise.all(recitationPromises)
    const filtered = loadedRecitations.filter((r): r is Recitation => r !== null)
    console.log(`Loaded ${filtered.length} complete surah audio files`)
    setRecitations(filtered)
  }

  // Note: Surah names are already loaded from Quran.Foundation chapters API
  // No need for separate AlQuran Cloud call since we get name_simple and name_arabic

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  }

  const handleCreatePlaylist = () => {
    setShowCreateInput(true)
  }

  const submitNewPlaylist = () => {
    const name = newPlaylistName.trim()
    if (!name) return
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      items: [],
    }
    setPlaylists([...playlists, newPlaylist])
    setNewPlaylistName('')
    setShowCreateInput(false)
  }

  const handleAddToPlaylist = (playlistId: string, recitation: Recitation) => {
    setPlaylists(
      playlists.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            items: [...p.items, { id: Date.now().toString(), recitationId: recitation.id, recitation }],
          }
        }
        return p
      })
    )
  }

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter((p) => p.id !== playlistId))
    if (currentPlaylist === playlistId) {
      setCurrentPlaylist(null)
      setIsPlaying(false)
    }
  }

  const handleRemoveFromPlaylist = (playlistId: string, itemId: string) => {
    setPlaylists(
      playlists.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            items: p.items.filter((item) => item.id !== itemId),
          }
        }
        return p
      })
    )
  }

  const handlePlayRecitation = (recitation: Recitation) => {
    if (audioRef.current && recitation.url) {
      audioRef.current.src = recitation.url
      audioRef.current.play().catch(e => console.error('Playback error:', e))
      setIsPlaying(true)
      setNowPlaying(recitation)
    }
  }

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (playlist && playlist.items.length > 0) {
      setCurrentPlaylist(playlistId)
      setCurrentTrackIndex(0)
      setIsPlaying(true)
      const firstTrack = playlist.items[0]
      if (audioRef.current && firstTrack.recitation.url) {
        audioRef.current.src = firstTrack.recitation.url
        audioRef.current.play().catch(e => console.error('Playback error:', e))
      }
    }
  }

  const currentPlaylistData = playlists.find((p) => p.id === currentPlaylist)
  const currentTrack = currentPlaylistData?.items[currentTrackIndex]

  useEffect(() => {
    if (currentTrack && audioRef.current && isPlaying) {
      const trackUrl = currentTrack.recitation.url
      if (trackUrl) {
        audioRef.current.src = trackUrl
        audioRef.current.play().catch(e => console.error('Playback error:', e))
      }
    }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (currentPlaylistData && currentTrackIndex < currentPlaylistData.items.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrackIndex, currentPlaylistData, volume])

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-islamic-primary dark:text-islamic-accent mb-8">
          🎵 Récitations Quran
        </h1>

        {/* Hidden audio element - always in DOM */}
        <audio ref={audioRef} />

        {/* Main Player */}
        {(currentTrack || nowPlaying) && (
          <div className="mb-8 bg-gradient-to-br from-islamic-primary to-islamic-accent dark:from-islamic-accent dark:to-islamic-primary rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-4 mb-6">
              <Music size={40} className="flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm opacity-80">En lecture maintenant</p>
                <p className="text-2xl font-bold">{currentTrack ? currentTrack.recitation.title : nowPlaying?.title}</p>
                <p className="text-sm opacity-90">{currentTrack ? currentTrack.recitation.reciter : nowPlaying?.reciter}</p>
              </div>
            </div>

            {/* Player Controls */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = parseFloat(e.target.value)
                    }
                  }}
                  className="w-full h-2 bg-white bg-opacity-30 rounded-full cursor-pointer appearance-none"
                />
                <div className="flex justify-between text-xs mt-2 opacity-80">
                  <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (currentPlaylistData && currentTrackIndex > 0) {
                      setCurrentTrackIndex(currentTrackIndex - 1)
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                >
                  -10s
                </button>

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause()
                      } else {
                        audioRef.current.play()
                      }
                      setIsPlaying(!isPlaying)
                    }
                  }}
                  className="w-16 h-16 rounded-full bg-white text-islamic-primary flex items-center justify-center hover:shadow-lg transition-all font-bold text-lg"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </button>

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                >
                  +10s
                </button>

                <button
                  onClick={() => {
                    if (currentPlaylistData && currentTrackIndex < currentPlaylistData.items.length - 1) {
                      setCurrentTrackIndex(currentTrackIndex + 1)
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Volume + Output */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs opacity-80">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white bg-opacity-30 rounded-full cursor-pointer appearance-none"
                  />
                </div>
                {outputDevices.length > 0 && (
                  <div>
                    <label className="text-xs opacity-80">Sortie audio</label>
                    <select
                      value={selectedOutputId}
                      onChange={async (e) => {
                        const sinkId = e.target.value
                        setSelectedOutputId(sinkId)
                        if (audioRef.current && (audioRef.current as any).setSinkId) {
                          try {
                            await (audioRef.current as any).setSinkId(sinkId)
                          } catch (err) {
                            console.warn('setSinkId failed:', err)
                          }
                        }
                      }}
                      className="w-full px-3 py-2 rounded bg-white bg-opacity-20"
                    >
                      <option value="">Par défaut</option>
                      {outputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Sortie ${d.deviceId.slice(0,6)}`}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Playlists */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">Playlists</h2>
                <button
                  onClick={handleCreatePlaylist}
                  className="bg-islamic-accent hover:bg-islamic-primary text-white p-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              {showCreateInput && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Nom de la playlist"
                    className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  />
                  <button
                    onClick={submitNewPlaylist}
                    className="px-3 py-2 bg-islamic-primary text-white rounded hover:opacity-90 text-sm"
                  >Créer</button>
                  <button
                    onClick={() => { setShowCreateInput(false); setNewPlaylistName('') }}
                    className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded hover:opacity-90 text-sm"
                  >Annuler</button>
                </div>
              )}

              <div className="space-y-2">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        currentPlaylist === playlist.id
                          ? 'bg-islamic-accent text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => handlePlayPlaylist(playlist.id)}>
                          <p className="font-semibold text-sm">{playlist.name}</p>
                          <p className="text-xs opacity-75">{playlist.items.length} piste(s)</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePlaylist(playlist.id)
                          }}
                          className="p-1 hover:opacity-75"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune playlist</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Recitations */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recitations Library */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent">
                  📚 Récitations (Cliquez PLAY pour écouter)
                </h2>
                <span className="text-xs px-2 py-1 rounded bg-islamic-light dark:bg-gray-700 text-gray-700 dark:text-gray-200">{recitations.length} chargées</span>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">Récitateur</label>
                  <select
                    value={selectedReciterId ?? ''}
                    onChange={async (e) => {
                      const id = parseInt(e.target.value)
                      setSelectedReciterId(id)
                      localStorage.setItem('selected_reciter_id', String(id))
                      // Rebuild chapters map and names for reload
                      const chaptersMap = new Map<number, any>()
                      chapters.forEach((c: any) => {
                        if (c.chapter_number) chaptersMap.set(c.chapter_number, c)
                        else if (c.id) chaptersMap.set(c.id, c)
                      })
                      // Fetch fallback names (cached by browser)
                      let fallbackNames: any[] = []
                      try {
                        const res = await fetch('https://api.alquran.cloud/v1/surah')
                        const data = await res.json()
                        fallbackNames = data.data || []
                      } catch {}
                      const reciterName = reciters.find((r: any) => r.id === id)?.name || 'Sélectionné'
                      await loadRecitationsForReciter(id, reciterName, chaptersMap, fallbackNames)
                    }}
                    className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                  >
                    {reciters.length > 0 ? (
                      reciters.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))
                    ) : (
                      <option value="">Par défaut</option>
                    )}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Chargement des récitations...</p>
                </div>
              ) : recitations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Aucune récitation disponible. Vérifiez votre connexion API.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recitations.map((recitation) => (
                    <div
                      key={recitation.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow border-l-4 border-islamic-accent"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-islamic-primary dark:text-islamic-accent">
                          {recitation.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{recitation.reciter}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{recitation.duration}</p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handlePlayRecitation(recitation)}
                          className="px-4 py-2 bg-islamic-primary hover:bg-islamic-accent text-white rounded-lg text-sm transition-colors flex items-center gap-2 font-bold shadow-md hover:shadow-lg"
                          title="Écouter cette récitation"
                        >
                          <Play size={18} />
                          PLAY
                        </button>

                        {currentPlaylistData && (
                          <button
                            onClick={() => handleAddToPlaylist(currentPlaylistData.id, recitation)}
                            className="p-2 bg-islamic-accent hover:bg-islamic-primary text-white rounded-lg transition-colors shadow-md"
                            title="Ajouter à la playlist"
                          >
                            <Plus size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Playlist Items */}
            {currentPlaylistData && currentPlaylistData.items.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-islamic-primary dark:text-islamic-accent mb-4">
                  📋 {currentPlaylistData.name}
                </h2>

                <div className="space-y-2">
                  {currentPlaylistData.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                        index === currentTrackIndex
                          ? 'bg-islamic-accent text-white shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div 
                        className="flex-1"
                        onClick={() => {
                          setCurrentTrackIndex(index)
                          if (audioRef.current && item.recitation.url) {
                            audioRef.current.src = item.recitation.url
                            audioRef.current.play()
                            setIsPlaying(true)
                          }
                        }}
                      >
                        <p className="font-semibold text-sm">{item.recitation.title}</p>
                        <p className="text-xs opacity-75">{item.recitation.reciter}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromPlaylist(currentPlaylistData.id, item.id)}
                        className="p-1 hover:opacity-75"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaPage
