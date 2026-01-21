import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { tmdbApi, getTitleLogo } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"

interface MovieCardProps {
  movie: Movie
  index: number
  isTop10?: boolean
  onOpenModal: (movie: Movie) => void
}

export function MovieCard({ movie, index, isTop10 = false, onOpenModal }: MovieCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // إضافة الـ animation CSS
    if (typeof document !== 'undefined') {
      const style = document.createElement('style')
      style.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `
      if (!document.querySelector('[data-movie-card-styles]')) {
        style.setAttribute('data-movie-card-styles', '')
        document.head.appendChild(style)
      }
    }
  }, [])

  const fetchLogo = async () => {
    if (loadingLogo || logo) return
    
    setLoadingLogo(true)
    try {
      const mediaType: 'movie' | 'tv' = movie.media_type === 'tv' ? 'tv' : 'movie'
      const detailsUrl = mediaType === 'tv' 
        ? tmdbApi.getTVDetails(movie.id)
        : tmdbApi.getMovieDetails(movie.id)
      
      const response = await fetch(detailsUrl)
      const details = await response.json()
      
      const logoUrl = getTitleLogo(details.images)
      setLogo(logoUrl)
    } catch (err) {
      console.error('Error fetching logo:', err)
    }
    setLoadingLogo(false)
  }

  const handlePlay = (e: React.MouseEvent) => {
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

  const handleMouseEnter = () => {
    setIsHovered(true)
    timeoutRef.current = setTimeout(() => {
      setShowPreview(true)
      // Fetch logo when preview shows
      fetchLogo()
    }, 400)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setShowPreview(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex-shrink-0 cursor-pointer movie-card",
        isTop10 ? "w-[100px] md:w-[120px]" : "w-[120px] md:w-[140px]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top 10 Number behind the poster */}
      {isTop10 && (
        <div className="absolute bottom-0 left-0 right-20 z-15 -translate-x-4 translate-y-2">
          <span
            className="font-bold"
            style={{
              fontSize: "8rem",
              color: "black",
              WebkitTextStroke: "2px white",
            }}
          >
            {index + 1}
          </span>
        </div>
      )}

      {/* Base Card */}
      <div
        onClick={() => onOpenModal(movie)}
        className={cn(
          "relative overflow-hidden rounded-sm transition-all duration-300 z-10",
          isTop10 
            ? "ml-6 md:ml-8 w-[150px] md:w-[170px] h-[220px] md:h-[250px] mr-8 md:mr-12"
            : "w-[140px] md:w-[170px]",
          isHovered ? "rounded" : ""
        )}
      >
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        
        {/* Netflix Original Badge */}
        {movie.isNetflixOriginal && (
          <>
            {/* Netflix Logo - Top Left */}
            <div className="absolute top-2 left-2 z-20">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                alt="Netflix"
                className="h-4 md:h-5 w-auto"
              />
            </div>
            
            {/* Netflix Original Badge - Bottom Left */}
            <div className="absolute bottom-2 left-2 z-20">
              <div className="bg-[#E50914] px-1.5 py-0.5 rounded-sm">
                <span className="text-white text-[7px] md:text-[9px] font-bold tracking-wide leading-none">
                  NETFLIX ORIGINAL
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hover Preview Card */}
      {showPreview && (
        <div
          className="absolute left-1/2 w-[280px] md:w-[320px] bg-[#181818] rounded-md shadow-2xl z-[60]"
          style={{
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: "fadeInScale 0.3s ease-out forwards",
            opacity: 0,
          }}
        >
          {/* Preview Image/Video */}
          <div className="relative">
            <img
              src={movie.backdrop}
              alt={movie.title}
              onClick={(e) => {
                e.stopPropagation()
                onOpenModal(movie)
              }}
              className="w-full aspect-video object-cover rounded-t-md cursor-pointer"
            />

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#181818] to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              {logo && (
                <img 
                  src={logo} 
                  alt={movie.title}
                  className="h-8 md:h-10 w-auto object-contain"
                  style={{ maxWidth: '200px' }}
                />
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
                  onClick={handlePlay}
                  className="w-8 h-8 rounded-full bg-white hover:bg-white/80 flex items-center justify-center transition-colors"
                >
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </button>

                {/* Add to List */}
                <button className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group">
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>

                {/* Like */}
                <button className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group">
                  <ThumbsUp className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>
              </div>

              {/* More Info */}
              <button
                onClick={() => onOpenModal(movie)}
                className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors group"
              >
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </button>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-500 font-semibold">{movie.match}% Match</span>
              <span className="border border-gray-500 px-1 py-0.5 text-[10px] text-gray-400">
                {movie.rating}
              </span>
              <span className="text-gray-400">{movie.duration}</span>
              <span className="border border-gray-500 px-1 py-0.5 text-[9px] text-gray-400 rounded">
                HD
              </span>
            </div>

            {/* Genres */}
            <div className="flex items-center gap-1 text-xs text-white">
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
  )
}