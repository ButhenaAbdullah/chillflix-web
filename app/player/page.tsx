// app/player/page.tsx

"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, ArrowLeft, ChevronDown, Maximize, Minimize } from "lucide-react"

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

const SERVERS: Record<Server, ServerConfig> = {
  server1: {
    name: 'Server 1',
    supportsArabic: true,
    buildUrl: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === 'tv') {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`
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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Fullscreen toggle function
  const toggleFullscreen = async () => {
    const container = containerRef.current

    if (!container) return

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen()
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  // 🚫 Smart Ad Blocker
  useEffect(() => {
    const TRUSTED_DOMAINS = [
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
      'streamwish.to'
    ]
    
    const isTrustedUrl = (url: string): boolean => {
      try {
        const urlObj = new URL(url)
        return TRUSTED_DOMAINS.some(domain => urlObj.hostname.includes(domain))
      } catch {
        return false
      }
    }
    
    const originalOpen = window.open
    
    window.open = function(...args) {
      const url = args[0]?.toString() || 'unknown'
      
      if (isTrustedUrl(url)) {
        return originalOpen.apply(this, args)
      }
      
      console.warn('🚫 Blocked ad popup:', url)
      return null
    }

    const originalAlert = window.alert
    const originalConfirm = window.confirm
    const originalPrompt = window.prompt
    
    window.alert = () => { return undefined }
    window.confirm = () => { return false }
    window.prompt = () => { return null }

    const preventAdClicks = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href) {
        const isExternal = !link.href.includes(window.location.hostname)
        const opensNewTab = link.target === '_blank' || link.target === '_top' || link.target === '_parent'
        
        if (isExternal && isTrustedUrl(link.href)) {
          return
        }
        
        if (isExternal || opensNewTab) {
          e.preventDefault()
          e.stopPropagation()
          e.stopImmediatePropagation()
          console.warn('🚫 Blocked ad link:', link.href)
          return false
        }
      }
    }

    const removeAdIframes = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IFRAME') {
            const iframe = node as HTMLIFrameElement
            const isPlayer = iframe.getAttribute('data-player') === 'true'
            
            if (!isPlayer) {
              console.warn('🚫 Removing ad iframe:', iframe.src)
              iframe.remove()
            }
          }
        })
      })
    })

    removeAdIframes.observe(document.body, {
      childList: true,
      subtree: true
    })

    const blockUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      delete e.returnValue
    }

    document.addEventListener('click', preventAdClicks, { capture: true })
    document.addEventListener('mousedown', preventAdClicks, { capture: true })
    document.addEventListener('mouseup', preventAdClicks, { capture: true })
    window.addEventListener('beforeunload', blockUnload)

    console.log('🚫 Smart Ad Blocker Active')

    return () => {
      window.open = originalOpen
      window.alert = originalAlert
      window.confirm = originalConfirm
      window.prompt = originalPrompt
      removeAdIframes.disconnect()
      document.removeEventListener('click', preventAdClicks, { capture: true })
      document.removeEventListener('mousedown', preventAdClicks, { capture: true })
      document.removeEventListener('mouseup', preventAdClicks, { capture: true })
      window.removeEventListener('beforeunload', blockUnload)
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
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500)
  }, [tmdbId, mediaType, season, episode, selectedServer])

  // Close dropdown when clicking outside
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

  const handleBack = () => {
    router.back()
  }

  const handleClose = () => {
    router.push('/')
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

        {/* Server Selection - Dropdown */}
        <div className="px-6 pb-3 flex items-center gap-3">
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
        </div>
      </div>

      {/* Player Container */}
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
              allowFullScreen={true}
              allow="fullscreen *; autoplay *; encrypted-media *; picture-in-picture *; accelerometer *; gyroscope *"
              referrerPolicy="no-referrer-when-downgrade"
              frameBorder="0"
              scrolling="no"
              {...({
                'allowfullscreen': 'true',
                'webkitallowfullscreen': 'true',
                'mozallowfullscreen': 'true',
                'msallowfullscreen': 'true',
                'allow-scripts': 'true',
                'allow-same-origin': 'true'
              } as any)}
              style={{ border: 'none' }}
            />
            
            {/* Fullscreen Button - Netflix Style */}
            <button
              onClick={toggleFullscreen}
              className={`absolute bottom-6 right-6 z-[60] group transition-all duration-300 ${
                isFullscreen 
                  ? 'bg-black/60 hover:bg-black/80 backdrop-blur-sm' 
                  : 'bg-gray-800/90 hover:bg-gray-700/90 backdrop-blur-sm'
              } p-3 rounded-full shadow-2xl border border-white/10 hover:border-white/20 hover:scale-110`}
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
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