// app/search/page.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"
import { searchMovies, tmdbApi, getTitleLogo } from "@/lib/tmdb"
import { MovieModal } from "@/components/netflix/movie-modal"
import type { Movie } from "@/lib/tmdb"
import { cn } from "@/lib/utils"

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Preview states
  const [hoveredMovie, setHoveredMovie] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState<number | null>(null)
  const [logos, setLogos] = useState<{ [key: number]: string | null }>({})
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    
    // Add animation CSS
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `
      if (!document.querySelector('[data-search-card-styles]')) {
        style.setAttribute('data-search-card-styles', '')
        document.head.appendChild(style)
      }
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults = await searchMovies(query)
        setResults(searchResults)
      } catch (err) {
        console.error('Search error:', err)
      }
      setLoading(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  const fetchLogo = async (movie: Movie) => {
    if (logos[movie.id]) return
    
    try {
      const mediaType: 'movie' | 'tv' = movie.media_type === 'tv' ? 'tv' : 'movie'
      const detailsUrl = mediaType === 'tv' 
        ? tmdbApi.getTVDetails(movie.id)
        : tmdbApi.getMovieDetails(movie.id)
      
      const response = await fetch(detailsUrl)
      const details = await response.json()
      
      const logoUrl = getTitleLogo(details.images)
      setLogos(prev => ({ ...prev, [movie.id]: logoUrl }))
    } catch (err) {
      console.error('Error fetching logo:', err)
    }
  }

  const handleMouseEnter = (movie: Movie) => {
    setHoveredMovie(movie.id)
    timeoutRef.current = setTimeout(() => {
      setShowPreview(movie.id)
      fetchLogo(movie)
    }, 400)
  }

  const handleMouseLeave = () => {
    setHoveredMovie(null)
    setShowPreview(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    inputRef.current?.focus()
  }

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedMovie(null), 300)
  }

  const handleBackClick = () => {
    router.push('/')
  }

  const handlePlay = (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation()
    
    const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie'
    const params = new URLSearchParams({
      id: movie.id.toString(),
      type: mediaType,
      title: encodeURIComponent(movie.title),
      ...(mediaType === 'tv' && {
        season: '1',
        episode: '1'
      })
    })

    router.push(`/player?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000000]">
        <div className="flex items-center justify-between px-4 md:px-14 py-3">
          <img 
            src="/splash.png" 
            alt="Netflix" 
            width={150}
            onClick={handleBackClick}
            className="cursor-pointer"
          />
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative flex items-center bg-[#2a2a2a] border border-white/20 rounded">
              <Search className="w-5 h-5 text-gray-400 ml-4" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, TV shows..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-4 py-3 text-base"
              />
              {query && (
                <button onClick={handleClear} className="pr-4">
                  <X className="w-5 h-5 text-gray-400 hover:text-white transition" />
                </button>
              )}
            </div>
          </div>

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
            alt="Profile"
            className="w-8 h-8 rounded"
          />
        </div>
      </nav>

      {/* Results */}
      <div className="pt-24 px-4 md:px-14">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white text-xl">No results found for "{query}"</p>
            <p className="text-gray-400 mt-2">Try different keywords</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <h2 className="text-white text-2xl font-bold mb-6">
              Search Results for "{query}"
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 pb-20">
              {results.map((movie) => (
                <div
                  key={movie.id}
                  className="relative group cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(movie)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Movie Card - Smaller */}
                  <div 
                    onClick={() => handleOpenModal(movie)}
                    className="relative aspect-[2/3] rounded overflow-hidden transition-transform hover:scale-105"
                  >
                    <img
                      src={movie.thumbnail}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Netflix Original Badge */}
                    {movie.isNetflixOriginal && (
                      <div className="absolute top-1 left-1">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                          alt="Netflix"
                          className="h-3 w-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Hover Preview Card */}
                  {showPreview === movie.id && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-0 w-[260px] md:w-[300px] bg-[#181818] rounded-md shadow-2xl z-[60]"
                      style={{
                        animation: "fadeInScale 0.3s ease-out forwards",
                      }}
                    >
                      {/* Preview Image */}
                      <div className="relative">
                        <img
                          src={movie.backdrop}
                          alt={movie.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(movie)
                          }}
                          className="w-full aspect-video object-cover rounded-t-md cursor-pointer"
                        />

                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#181818] to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          {logos[movie.id] ? (
                            <img 
                              src={logos[movie.id]!} 
                              alt={movie.title}
                              className="h-8 w-auto object-contain"
                              style={{ maxWidth: '180px' }}
                            />
                          ) : (
                            <h3 className="text-white text-sm font-bold line-clamp-1">
                              {movie.title}
                            </h3>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3 space-y-2">
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Play Button */}
                            <button 
                              onClick={(e) => handlePlay(e, movie)}
                              className="w-7 h-7 rounded-full bg-white hover:bg-white/80 flex items-center justify-center transition-colors"
                            >
                              <Play className="w-3 h-3 fill-black text-black ml-0.5" />
                            </button>

                            {/* Add to List */}
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group"
                            >
                              <Plus className="w-3 h-3 text-gray-400 group-hover:text-white" />
                            </button>

                            {/* Like */}
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group"
                            >
                              <ThumbsUp className="w-3 h-3 text-gray-400 group-hover:text-white" />
                            </button>
                          </div>

                          {/* More Info */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenModal(movie)
                            }}
                            className="w-7 h-7 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group"
                          >
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-white" />
                          </button>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-500 font-semibold">{movie.match}% Match</span>
                          <span className="border border-gray-500 px-1 py-0.5 text-[9px] text-gray-400">
                            {movie.rating}
                          </span>
                          <span className="text-gray-400 text-[11px]">{movie.duration}</span>
                        </div>

                        {/* Genres */}
                        <div className="flex items-center gap-1 text-[11px] text-white">
                          {movie.genres.slice(0, 3).map((genre, i) => (
                            <span key={genre} className="flex items-center">
                              {i > 0 && <span className="text-gray-500 mx-1">•</span>}
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {!query && !loading && (
          <div className="text-center py-20">
            <Search className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-xl">Search for your favorite content</p>
            <p className="text-gray-400 mt-2">Movies, TV shows, and more...</p>
          </div>
        )}
      </div>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}