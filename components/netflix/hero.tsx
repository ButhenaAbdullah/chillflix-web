"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Info, Volume2, VolumeX } from "lucide-react"
import { tmdbApi, convertTMDBToMovie, getTitleLogo } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"

interface HeroProps {
  onMoreInfo: (movie: Movie) => void
  mediaTypeFilter?: 'movie' | 'tv' | 'all'
}

export function Hero({ onMoreInfo, mediaTypeFilter = 'all' }: HeroProps) {
  const router = useRouter()
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [logo, setLogo] = useState<string | null>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    async function fetchHeroMovie() {
      try {
        const trendingRes = await fetch(tmdbApi.getTrending())
        const trendingData = await trendingRes.json()
        if (!trendingData.results || trendingData.results.length === 0) return

        let filteredItems = trendingData.results.filter((item: any) => item.poster_path)
        
        if (mediaTypeFilter === 'movie') {
          filteredItems = filteredItems.filter((item: any) => item.media_type === 'movie')
        } else if (mediaTypeFilter === 'tv') {
          filteredItems = filteredItems.filter((item: any) => item.media_type === 'tv')
        }

        const latestItem = filteredItems
          .sort((a: any, b: any) => {
            const dateA = new Date(a.release_date || a.first_air_date).getTime()
            const dateB = new Date(b.release_date || b.first_air_date).getTime()
            return dateB - dateA
          })[0]

        if (!latestItem) return

        const movie = convertTMDBToMovie(latestItem, latestItem.media_type)
        
        if (!movie) {
          console.warn("Hero movie was blocked, trying next item")
          return
        }

        const mediaType: "movie" | "tv" = movie.media_type === "tv" ? "tv" : "movie"
        const detailsUrl = mediaType === "tv"
          ? tmdbApi.getTVDetails(movie.id)
          : tmdbApi.getMovieDetails(movie.id)

        const detailsRes = await fetch(detailsUrl)
        const details = await detailsRes.json()

        const movieLogo = getTitleLogo(details.images)
        setLogo(movieLogo)

        if (mediaType === "tv") {
          const usRating = details.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "US")
          movie.rating = usRating?.rating || "TV-14"
        } else {
          const usRelease = details.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US")
          movie.rating = usRelease?.release_dates?.[0]?.certification || "PG-13"
        }

        movie.match = Math.round(details.vote_average * 10)

        if (mediaType === "tv") {
          movie.duration = details.number_of_seasons 
            ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`
            : "1 Season"
        } else {
          const runtime = details.runtime || 0
          const hours = Math.floor(runtime / 60)
          const minutes = runtime % 60
          movie.duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        }

        if (details.genres && details.genres.length > 0) {
          movie.genres = details.genres.map((g: any) => g.name)
        }

        
        if (details.credits?.cast) {
          movie.cast = details.credits.cast.slice(0, 5).map((c: any) => c.name)
        }

        setFeaturedMovie(movie)

        if (details.videos?.results?.length > 0) {
          const trailer = details.videos.results.find((v: any) => v.type === "Trailer" && v.site === "YouTube")
          if (trailer) setTrailerKey(trailer.key)
        }

      } catch (err) {
        console.error("Error fetching hero movie:", err)
      }
    }

    fetchHeroMovie()
  }, [mediaTypeFilter])

  const handleMuteToggle = () => setIsMuted(!isMuted)

  const handlePlay = () => {
    if (!featuredMovie) return
    
    const mediaType = featuredMovie.media_type || 'movie'
    const params = new URLSearchParams({
      id: featuredMovie.id.toString(),
      type: mediaType,
      title: encodeURIComponent(featuredMovie.title),
      ...(mediaType === 'tv' && {
        season: '1',
        episode: '1'
      })
    })

    router.push(`/player?${params.toString()}`)
  }

  if (!featuredMovie) return <div className="h-[85vh] w-full bg-black" />

  return (
    <div className="relative h-[85vh] w-full">
      {/* Background */}
      <img
        src={featuredMovie.backdrop}
        alt={featuredMovie.title}
        className={`absolute inset-0 w-full h-full object-cover z-10 ${showTrailer ? "blur-sm opacity-0" : "blur-0 opacity-100"} transition-all duration-700`}
      />

      {/* Trailer */}
      {trailerKey && showTrailer && (
        <iframe
          ref={videoRef}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&disablekb=1&fs=0`}
          className="absolute inset-0 w-full h-full scale-150 z-0 pointer-events-none"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/40 to-transparent z-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />

      {/* Content */}
      <div className="relative z-30 h-full flex flex-col justify-center px-4 md:px-14 pt-20 max-w-xl space-y-4">
        {/* Title */}
        {logo ? (
          <img
            src={logo}
            alt={featuredMovie.title}
            className="h-20 md:h-28 lg:h-36 w-auto object-contain max-w-[500px]"
          />
        ) : (
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">{featuredMovie.title}</h1>
        )}

        {/* Description */}
        <p className="text-white/90 text-base md:text-lg line-clamp-3">{featuredMovie.description}</p>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={handlePlay}
            className="flex items-center gap-2 bg-white hover:bg-white/80 text-black font-semibold px-6 md:px-8 py-2 md:py-3 rounded transition-all"
          >
            <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" />
            <span className="text-lg md:text-xl">Play</span>
          </button>
          <button
            onClick={() => onMoreInfo(featuredMovie)}
            className="flex items-center gap-2 bg-gray-500/70 hover:bg-gray-500/50 text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded transition-all"
          >
            <Info className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-lg md:text-xl">More Info</span>
          </button>
        </div>

        {/* Mute and Rating */}
        <div className="absolute bottom-32 right-0 flex items-center gap-3">
          {trailerKey && (
            <button
              onClick={handleMuteToggle}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/50 flex items-center justify-center hover:border-white transition-all hover:bg-white/10"
            >
              {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white" />}
            </button>
          )}
          <div className="bg-gray-500/50 border-l-4 border-white/40 pl-3 pr-8 py-1">
            <span className="text-white text-sm">{featuredMovie.rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}