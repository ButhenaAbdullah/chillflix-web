"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MovieCard } from "./movie-card"
import type { Movie } from "@/lib/tmdb"
import { convertTMDBToMovie, getAllNetflixOriginals } from "@/lib/tmdb"
import { cn } from "@/lib/utils"

interface MovieRowProps {
  title: string
  fetchUrl: string
  isTop10?: boolean
  onOpenModal: (movie: Movie) => void
}

export function MovieRow({ title, fetchUrl, isTop10 = false, onOpenModal }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [animatingCards, setAnimatingCards] = useState<Set<number>>(new Set())
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)
        
        // Check if this is Netflix Originals
        if (fetchUrl === 'netflix-originals') {
          const netflixMovies = await getAllNetflixOriginals()
          setMovies(netflixMovies)
          setLoading(false)
          return
        }

        // Regular fetch for other categories
        const response = await fetch(fetchUrl)
        const data = await response.json()
        
        if (data.results) {
          // Sort by vote_average (rating) for Top 10
          let results = isTop10 
            ? [...data.results].sort((a: any, b: any) => b.vote_average - a.vote_average).slice(0, 10)
            : data.results
          
          const convertedMovies = results
            .map((tmdbMovie: any, index: number): Movie | null => {
              // Pass media_type to convertTMDBToMovie
              const movie = convertTMDBToMovie(tmdbMovie, tmdbMovie.media_type)
              
              // إذا المحتوى محظور (null)، نتجاهله
              if (!movie) return null
              
              if (isTop10) {
                movie.isTop10 = true
                movie.top10Rank = index + 1
              }
              return movie
            })
            .filter((movie: Movie | null): movie is Movie => movie !== null) // إزالة null
          
          setMovies(convertedMovies)
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching movies:', err)
        setLoading(false)
      }
    }

    fetchMovies()
  }, [fetchUrl, isTop10])

  // تحديث حالة الأسهم عند التحميل - بدون animation للكروت الأولية
  useEffect(() => {
    if (!loading && rowRef.current && movies.length > 0) {
      handleScroll()
      // الكروت الأولية تظهر مباشرة بدون animation
      setHasScrolled(false)
      setAnimatingCards(new Set())
    }
  }, [loading, movies])

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return

    const container = rowRef.current
    const scrollAmount = container.offsetWidth - 80
    
    // تفعيل الـ scroll mode
    setHasScrolled(true)
    
    // إخفاء الكروت الحالية
    setAnimatingCards(new Set())
    
    // الـ scroll
    setTimeout(() => {
      if (direction === "right") {
        container.scrollBy({ 
          left: scrollAmount, 
          behavior: "smooth" 
        })
      } else {
        container.scrollBy({ 
          left: -scrollAmount, 
          behavior: "smooth" 
        })
      }
    }, 50)
    
    // بعد انتهاء الـ scroll، نظهر الكروت الجديدة بالـ animation
    setTimeout(() => {
      const newVisibleCards = getVisibleCardIndices()
      setAnimatingCards(new Set(newVisibleCards))
    }, 400) // 50ms + 350ms scroll duration
  }

  const getVisibleCardIndices = (): number[] => {
    if (!rowRef.current) return []
    
    const container = rowRef.current
    const scrollLeft = container.scrollLeft
    const containerWidth = container.offsetWidth
    const cardWidth = 180 // تقريبي مع المسافات
    
    const startIndex = Math.floor(scrollLeft / cardWidth)
    const endIndex = Math.ceil((scrollLeft + containerWidth) / cardWidth)
    
    const indices: number[] = []
    for (let i = startIndex; i <= endIndex && i < movies.length; i++) {
      indices.push(i)
    }
    return indices
  }

  const handleScroll = () => {
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 0)
      setShowRightArrow(
        rowRef.current.scrollLeft <
          rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
      )
    }
  }

  if (loading) {
    return (
      <div className="px-4 md:px-14 mb-8 z-30">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4">{title}</h2>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[200px] md:w-[240px] h-[135px] bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (movies.length === 0) {
    return null
  }

  return (
    <div
      className="relative px-4 md:px-14 -my-2 group/row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title */}
      <h2 className="text-lg md:text-xl font-bold text-white -mb-10 flex items-center gap-2 cursor-pointer group/title relative z-10">
        <span>{title}</span>
        <span className="text-[#54b9c5] text-sm opacity-0 group-hover/title:opacity-100 transition-opacity flex items-center">
          Explore All
          <ChevronRight className="w-4 h-4" />
        </span>
      </h2>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes netflixSlideIn {
          0% {
            opacity: 0;
            transform: translateX(60px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        .movie-card-wrapper {
          opacity: 1;
          transition: opacity 0.2s ease-out;
        }
        
        .movie-card-wrapper.scrolling {
          animation: fadeOut 0.15s ease-out forwards;
        }
        
        .card-animate {
          animation: netflixSlideIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        /* Staggered delays - more natural */
        .card-animate:nth-child(1) { animation-delay: 0s; }
        .card-animate:nth-child(2) { animation-delay: 0.06s; }
        .card-animate:nth-child(3) { animation-delay: 0.12s; }
        .card-animate:nth-child(4) { animation-delay: 0.18s; }
        .card-animate:nth-child(5) { animation-delay: 0.24s; }
        .card-animate:nth-child(6) { animation-delay: 0.3s; }
        .card-animate:nth-child(7) { animation-delay: 0.36s; }
        .card-animate:nth-child(8) { animation-delay: 0.42s; }
      `}</style>
      
      {/* Slider Container */}
      <div className="relative -mx-4 md:-mx-14 slider-container overflow-visible">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className={cn(
            "absolute left-0 top-0 bottom-0 z-40 w-12 md:w-16 flex items-center justify-center transition-all duration-200",
            "bg-black/60 hover:bg-black/80 backdrop-blur-sm",
            showLeftArrow && isHovered ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        >
          <ChevronLeft className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />
        </button>

        {/* Movies Slider */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className={cn(
            "flex overflow-x-auto overflow-y-visible px-4 md:px-14 pt-12 pb-20",
            isTop10 ? "gap-19" : "gap-12"
          )}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className={cn(
                'movie-card-wrapper',
                hasScrolled && !animatingCards.has(index) && 'scrolling',
                animatingCards.has(index) && 'card-animate'
              )}
            >
              <MovieCard
                movie={movie}
                index={index}
                isTop10={isTop10}
                onOpenModal={onOpenModal}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className={cn(
            "absolute right-0 top-0 bottom-0 z-40 w-12 md:w-16 flex items-center justify-center transition-all duration-200",
            "bg-black/60 hover:bg-black/80 backdrop-blur-sm",
            showRightArrow && isHovered ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        >
          <ChevronRight className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-lg" />
        </button>
      </div>
    </div>
  )
}