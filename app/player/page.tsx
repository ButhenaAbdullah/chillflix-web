// app/player/page.tsx

"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, ArrowLeft, ChevronDown, Maximize, Minimize, Subtitles } from "lucide-react"

type Server = 'server1' | 'server2' | 'server3' 

interface ServerConfig {
  name: string
  buildUrl: (params: {
    tmdbId: string
    mediaType: string
    season?: string
    episode?: string
  }) => string
  supportsArabic: boolean
}

interface Subtitle {
  start: number
  end: number
  text: string
}

const SERVERS: Record<Server, ServerConfig> = {
  server1: {
    name: 'VidLink',
    supportsArabic: true,
    buildUrl: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === 'tv') {
        return `https://vidlink.pro/tv/${tmdbId}/${season || 1}/${episode || 1}?player=default&primaryColor=E50914&secondaryColor=831010&iconColor=FFFFFF&autoplay=true`
      }
      return `https://vidlink.pro/movie/${tmdbId}?player=default&primaryColor=E50914&secondaryColor=831010&iconColor=FFFFFF&autoplay=true`
    }
  },
  server2: {
    name: 'Server 2',
    supportsArabic: true,
    buildUrl: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === 'tv') {
        return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`
      }
      return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
    }
  },
  server3: {
    name: 'Server 3',
    supportsArabic: true,
    buildUrl: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === 'tv') {
        return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`
      }
      return `https://moviesapi.club/movie/${tmdbId}`
    }
  },
}

// ✅ Parse SRT Subtitles
function parseSRT(srtText: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const blocks = srtText.trim().split('\n\n')

  blocks.forEach(block => {
    const lines = block.split('\n')
    if (lines.length < 3) return

    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    if (!timeMatch) return

    const start = 
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000

    const end = 
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000

    const text = lines.slice(2).join('\n')

    subtitles.push({ start, end, text })
  })

  return subtitles
}


// Fetch Arabic subtitles through a server endpoint to avoid browser-side 403/CORS/header limits
async function fetchArabicSubtitles(tmdbId: string, mediaType: string, season?: string, episode?: string): Promise<Subtitle[]> {
  try {
    const params = new URLSearchParams({
      id: tmdbId,
      type: mediaType,
    })

    if (mediaType === 'tv') {
      params.set('season', season || '1')
      params.set('episode', episode || '1')
    }

    const response = await fetch(`/api/subtitles?${params.toString()}`)

    if (!response.ok) {
      console.warn('Failed to fetch subtitles:', response.status, response.statusText)
      return []
    }

    const data = (await response.json()) as { subtitles?: Subtitle[] }
    return Array.isArray(data.subtitles) ? data.subtitles : []
  } catch (error) {
    console.error('Error fetching subtitles:', error)
    return []
  }
}


function PlayerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const tmdbId = searchParams.get('id')
  const mediaType = searchParams.get('type') || 'movie'
  const season = searchParams.get('season') || '1'
  const episode = searchParams.get('episode') || '1'
  const title = searchParams.get('title') || 'Watch Now'

  const [selectedServer, setSelectedServer] = useState<Server>('server1')
  const [playerUrl, setPlayerUrl] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ Load Arabic Subtitles
  useEffect(() => {
    if (!tmdbId || !subtitlesEnabled) return

    const loadSubtitles = async () => {
      setIsLoadingSubtitles(true)
      const subs = await fetchArabicSubtitles(tmdbId, mediaType, season, episode)
      setSubtitles(subs)
      setIsLoadingSubtitles(false)
      
      if (subs.length > 0) {
        console.log('✅ Arabic subtitles loaded:', subs.length, 'lines')
      }
    }

    loadSubtitles()
  }, [tmdbId, mediaType, season, episode, subtitlesEnabled])

  // ✅ Update Current Subtitle Based on Time
  useEffect(() => {
    if (!subtitlesEnabled || subtitles.length === 0) {
      setCurrentSubtitle('')
      return
    }

    const updateSubtitle = () => {
      const current = subtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
      )
      setCurrentSubtitle(current?.text || '')
    }

    updateSubtitle()
  }, [currentTime, subtitles, subtitlesEnabled])

  // ✅ Simulate video time tracking
  useEffect(() => {
    if (!subtitlesEnabled) return

    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 0.1)
    }, 100)

    return () => clearInterval(interval)
  }, [subtitlesEnabled])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen()
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  // ✅ ULTRA AGGRESSIVE AD BLOCKER - Maximum Protection
  useEffect(() => {
    // ✅ Comprehensive blocked domains list
    const BLOCKED_DOMAINS = [
      'googlesyndication.com',
      'doubleclick.net',
      'googleadservices.com',
      'adservice.google.com',
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.net',
      'connect.facebook.net',
      'adexchangeclear.com',
      'usrpubtrk.com',
      'adnxs.com',
      'advertising.com',
      'adsystem.com',
      'outbrain.com',
      'taboola.com',
      'criteo.com',
      'pubmatic.com',
      'rubiconproject.com',
      'openx.net',
      'casalemedia.com',
      'quantserve.com',
      'scorecardresearch.com',
      'adblade.com',
      'adtech.de',
      'revcontent.com',
      'zedo.com',
      'mgid.com',
      'virool.com',
      'yieldmo.com',
      'sharethrough.com',
      'teads.tv',
      'advertising.com',
      'bidswitch.net',
      'smartadserver.com',
      'adform.net',
      'serving-sys.com',
      'exponential.com',
      'admixer.net',
      'contextweb.com',
      'advertising.com',
    ]

    const BLOCKED_PATTERNS = [
      /ads?[\-_\.]?server/i,
      /ad[\-_\.]?service/i,
      /advertising/i,
      /analytics/i,
      /tracker/i,
      /tracking/i,
      /popunder/i,
      /popup/i,
      /banner/i,
      /sponsor/i,
      /promo/i,
      /adsbygoogle/i,
      /\/ad[sx]?\//i,
      /\/ads\./i,
      /\/banner/i,
      /\/sponsor/i,
    ]

    const TRUSTED_DOMAINS = [
      'vidlink.pro',
      'vidlink',
      'stream',
      'vidsrc.xyz',
      'vidsrc.cc',
      'vidsrc.pro',
      'moviesapi.club',
      '2embed.cc',
      'streamtape.com',
      'doodstream.com',
      'upstream.to',
      'mixdrop.co',
      'filemoon.sx',
      'vidcloud.pro',
      'vidplay.online',
      'embedsito.com',
      'voe.sx',
      'streamwish.to',
      'opensubtitles.com',
      'opensubtitles.org',
    ]

    const isBlockedDomain = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        return BLOCKED_DOMAINS.some(domain => urlObj.hostname.includes(domain))
      } catch {
        return false
      }
    }

    const isBlockedPattern = (url: string): boolean => {
      return BLOCKED_PATTERNS.some(pattern => pattern.test(url))
    }

    const isTrustedDomain = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        return TRUSTED_DOMAINS.some(domain => urlObj.hostname.includes(domain))
      } catch {
        return false
      }
    }

    const shouldBlock = (url: string): boolean => {
      return (isBlockedDomain(url) || isBlockedPattern(url)) && !isTrustedDomain(url)
    }

    // ✅ Block window.open
    const originalOpen = window.open
    window.open = function (...args: Parameters<typeof window.open>) {
      const url = args[0]?.toString() || ''
      if (shouldBlock(url)) {
        console.warn('🚫 Blocked popup:', url)
        return null
      }
      return originalOpen.call(window, ...args)
    }

    // ✅ Block fetch requests
    const originalFetch = window.fetch
    window.fetch = function (...args: Parameters<typeof fetch>) {
      const url = args[0]?.toString() || ''
      if (shouldBlock(url)) {
        console.warn('🚫 Blocked fetch:', url)
        return Promise.reject(new Error('Blocked by ad blocker'))
      }
      return originalFetch(...args)
    }

    // ✅ Block XHR requests
    const originalXHROpen = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      const requestUrl = url?.toString() || ''
      if (shouldBlock(requestUrl)) {
        console.warn('🚫 Blocked XHR:', requestUrl)
        return
      }

      if (typeof async === 'undefined') {
        return (originalXHROpen as (method: string, url: string | URL) => void).call(this, method, url)
      }

      return (originalXHROpen as (method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null) => void).call(this, method, url, async, username, password)
    }

    // ✅ Disable dialogs
    window.alert = () => undefined
    window.confirm = () => false
    window.prompt = () => null

    // ✅ Block script injection
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Remove ad scripts
          if (node.nodeName === 'SCRIPT') {
            const script = node as HTMLScriptElement
            if (shouldBlock(script.src || script.innerHTML)) {
              console.warn('🚫 Removed ad script:', script.src)
              script.remove()
            }
          }

          // Remove ad iframes
          if (node.nodeName === 'IFRAME') {
            const iframe = node as HTMLIFrameElement
            const isPlayer = iframe.getAttribute('data-player') === 'true'
            if (!isPlayer && shouldBlock(iframe.src)) {
              console.warn('🚫 Removed ad iframe:', iframe.src)
              iframe.remove()
            }
          }

          // Remove suspicious overlays
          if (node.nodeName === 'DIV') {
            const div = node as HTMLDivElement
            const style = window.getComputedStyle(div)
            const zIndex = parseInt(style.zIndex || '0')
            
            if (
              (style.position === 'fixed' || style.position === 'absolute') &&
              zIndex > 9999 &&
              !div.getAttribute('data-player') &&
              !div.closest('[data-player="true"]')
            ) {
              console.warn('🚫 Removed suspicious overlay')
              div.remove()
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // ✅ Block click hijacking
    const preventAdClicks = (e: Event) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link?.href && shouldBlock(link.href)) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.warn('🚫 Blocked ad link:', link.href)
        return false
      }

      // Block suspicious high z-index elements
      if (target.style.position === 'absolute' || target.style.position === 'fixed') {
        const zIndex = parseInt(window.getComputedStyle(target).zIndex || '0')
        if (zIndex > 9999 && !target.closest('[data-player="true"]')) {
          e.preventDefault()
          e.stopPropagation()
          console.warn('🚫 Blocked overlay click')
          return false
        }
      }
    }

    document.addEventListener('click', preventAdClicks, { capture: true })
    document.addEventListener('mousedown', preventAdClicks, { capture: true })
    document.addEventListener('touchstart', preventAdClicks, { capture: true })

    // ✅ Clear console spam
    const originalConsoleError = console.error
    console.error = function(...args) {
      const message = args[0]?.toString() || ''
      if (shouldBlock(message)) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    console.log('🛡️ Ultra Ad Blocker Active - Maximum Protection Enabled')

    return () => {
      window.open = originalOpen
      window.fetch = originalFetch
      XMLHttpRequest.prototype.open = originalXHROpen
      observer.disconnect()
      document.removeEventListener('click', preventAdClicks, { capture: true })
      document.removeEventListener('mousedown', preventAdClicks, { capture: true })
      document.removeEventListener('touchstart', preventAdClicks, { capture: true })
      console.error = originalConsoleError
    }
  }, [])

  // Build Player URL
  useEffect(() => {
    if (!tmdbId) return

    setIsLoading(true)
    const serverConfig = SERVERS[selectedServer]
    const url = serverConfig.buildUrl({
      tmdbId,
      mediaType,
      season: mediaType === 'tv' ? season : undefined,
      episode: mediaType === 'tv' ? episode : undefined
    })

    setPlayerUrl(url)
    setTimeout(() => setIsLoading(false), 500)
  }, [tmdbId, mediaType, season, episode, selectedServer])

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleBack = () => router.push('/')
  const handleClose = () => router.push('/')
  const toggleSubtitles = () => {
    setSubtitlesEnabled(!subtitlesEnabled)
    if (!subtitlesEnabled) setCurrentTime(0)
  }

  if (!tmdbId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">No content selected</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#e50914] text-white rounded hover:bg-[#f40612] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/95 to-transparent transition-all duration-300 ${isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-medium">Back</span>
          </button>

          <h1 className="text-white text-xl font-semibold truncate max-w-xl">
            {decodeURIComponent(title)}
          </h1>

          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* <div className="px-6 pb-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-38 bg-[#e50914] hover:bg-[#f40612] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 justify-between transition"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{SERVERS[selectedServer].name}</span>
                {SERVERS[selectedServer].supportsArabic && (
                  <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Ar</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-50 bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden shadow-xl z-50">
                {(Object.keys(SERVERS) as Server[]).map((serverKey) => {
                  const server = SERVERS[serverKey]
                  return (
                    <button
                      key={serverKey}
                      onClick={() => {
                        setSelectedServer(serverKey)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#e50914] transition flex items-center justify-between ${
                        selectedServer === serverKey ? 'bg-[#e50914]' : ''
                      }`}
                    >
                      <span className="text-white font-medium">{server.name}</span>
                      {server.supportsArabic && (
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white">Ar</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={toggleSubtitles}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${
              subtitlesEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={subtitlesEnabled ? 'Disable Arabic Subtitles' : 'Enable Arabic Subtitles'}
          >
            <Subtitles className="w-5 h-5" />
            <span className="font-medium">{subtitlesEnabled ? 'AR' : 'OFF'}</span>
          </button>
        </div> */}
      </div>

      {/* Player */}
      <div 
        ref={containerRef}
        className={`w-full flex items-center justify-center ${isFullscreen ? 'h-screen pt-0' : 'h-screen pt-32'} relative`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
            <p className="text-white text-lg">Loading player...</p>
          </div>
        ) : playerUrl ? (
          <div key={playerUrl} className="w-full h-full relative">
            <iframe
              ref={iframeRef}
              data-player="true"
              src={playerUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 'none' }}
            />
            
            {/* Subtitles */}
            {subtitlesEnabled && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-50">
                <div className="max-w-4xl px-4">
                  {isLoadingSubtitles ? (
                    <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-center">
                      <p className="text-sm">Loading Arabic subtitles...</p>
                    </div>
                  ) : currentSubtitle ? (
                    <div 
                      className="bg-black/90 text-white px-6 py-3 rounded-lg text-center backdrop-blur-sm border border-white/10"
                      style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '1.25rem',
                        lineHeight: '1.6',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        direction: 'rtl'
                      }}
                    >
                      {currentSubtitle.split('\n').map((line, i) => (
                        <p key={i} className="mb-1 last:mb-0">{line}</p>
                      ))}
                    </div>
                  ) : subtitles.length > 0 ? (
                    <div className="bg-black/60 text-white/60 px-4 py-2 rounded-lg text-center text-sm">
                      Arabic subtitles ready ({subtitles.length} lines)
                    </div>
                  ) : (
                    <div className="bg-orange-900/80 text-white px-4 py-2 rounded-lg text-center text-sm">
                      Add OPENSUBTITLES_API_KEY to .env.local
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`absolute bottom-6 right-6 z-[60] transition-all duration-300 ${
                isFullscreen 
                  ? 'bg-black/60 hover:bg-black/80' 
                  : 'bg-gray-800/90 hover:bg-gray-700/90'
              } backdrop-blur-sm p-3 rounded-full shadow-2xl border border-white/10 hover:border-white/20 hover:scale-110`}
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6 text-white drop-shadow-lg" />
              ) : (
                <Maximize className="w-6 h-6 text-white drop-shadow-lg" />
              )}
            </button>
          </div>
        ) : (
          <div className="text-white text-lg">No player available</div>
        )}
      </div>
    </div>
  )
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PlayerContent />
    </Suspense>
  )
}

