"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Play, Plus, ThumbsUp, ThumbsDown, Volume2, VolumeX } from "lucide-react"
import type { Movie } from "@/lib/tmdb"
import { tmdbApi, getImageUrl, convertTMDBToMovie, getTitleLogo } from "@/lib/tmdb"
import { cn } from "@/lib/utils"

interface MovieModalProps {
  movie: Movie | null
  isOpen: boolean
  onClose: () => void
}

interface Episode {
  episode_number: number
  name: string
  overview: string
  still_path: string | null
  runtime: number
  air_date: string
}

interface DetailedMovie extends Movie {
  credits?: {
    cast: Array<{ name: string; character: string }>
    crew: Array<{ name: string; job: string }>
  }
  videos?: Array<{ key: string; type: string; site: string }>
  episodes?: Episode[]
  logo?: string | null
}

export function MovieModal({ movie, isOpen, onClose }: MovieModalProps) {
  const router = useRouter()
  const modalRef = useRef<HTMLDivElement>(null)
  const [details, setDetails] = useState<DetailedMovie | null>(null)
  const [similar, setSimilar] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  
  // Trailer states
  const [showTrailer, setShowTrailer] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const trailerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.body.style.overflow = "unset"
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!movie || !isOpen) return

    setLoading(true)
    setShowTrailer(false)
    
    if (trailerTimeoutRef.current) {
      clearTimeout(trailerTimeoutRef.current)
    }

    const mediaType: 'movie' | 'tv' = movie.media_type === 'tv' || movie.seasons ? 'tv' : 'movie'
    
    const detailsUrl = mediaType === 'tv' 
      ? tmdbApi.getTVDetails(movie.id)
      : tmdbApi.getMovieDetails(movie.id)

    Promise.all([
      fetch(detailsUrl).then(res => res.json()),
      fetch(tmdbApi.getSimilar(movie.id, mediaType)).then(res => res.json())
    ])
      .then(([detailsData, similarData]) => {
        // Extract rating based on media type
        let rating = "PG-13"
        if (mediaType === "tv") {
          const usRating = detailsData.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "US")
          rating = usRating?.rating || "TV-14"
        } else {
          const usRelease = detailsData.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US")
          rating = usRelease?.release_dates?.[0]?.certification || "PG-13"
        }

        // Calculate duration
        let duration = "2h 15m"
        if (mediaType === 'tv') {
          duration = detailsData.number_of_seasons 
            ? `${detailsData.number_of_seasons} Season${detailsData.number_of_seasons > 1 ? 's' : ''}`
            : "1 Season"
        } else {
          const runtime = detailsData.runtime || 0
          const hours = Math.floor(runtime / 60)
          const minutes = runtime % 60
          duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        }

        const updatedMovie: DetailedMovie = {
          ...movie,
          cast: detailsData.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
          creator: detailsData.created_by?.[0]?.name || 
                   detailsData.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 
                   'Unknown',
          genres: detailsData.genres?.map((g: any) => g.name) || movie.genres,
          seasons: detailsData.number_of_seasons,
          credits: detailsData.credits,
          videos: detailsData.videos?.results,
          logo: getTitleLogo(detailsData.images),
          rating: rating,
          duration: duration,
          match: Math.round(detailsData.vote_average * 10)
        }

        // Get trailer
        if (detailsData.videos && detailsData.videos.results) {
          const trailer = detailsData.videos.results.find(
            (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
          )
          if (trailer) {
            setTrailerKey(trailer.key)
            // Start timer to show trailer after 3 seconds
            trailerTimeoutRef.current = setTimeout(() => {
              setShowTrailer(true)
            }, 3000)
          }
        }

        setDetails(updatedMovie)

// Around line 160-170, update the similar movies mapping:
const convertedSimilar = similarData.results
  ?.slice(0, 6)
  .map((tmdbMovie: any) => convertTMDBToMovie(tmdbMovie, tmdbMovie.media_type))
  .filter((movie: Movie | null): movie is Movie => movie !== null) || [] // Add this filter!

setSimilar(convertedSimilar)
        // Load episodes for TV shows
        if (mediaType === 'tv' && detailsData.number_of_seasons > 0) {
          loadEpisodes(movie.id, 1)
        }
      })
      .catch(err => {
        console.error('Error fetching movie details:', err)
        setDetails(movie as DetailedMovie)
        setLoading(false)
      })

    return () => {
      if (trailerTimeoutRef.current) {
        clearTimeout(trailerTimeoutRef.current)
      }
    }
  }, [movie, isOpen])

  const loadEpisodes = async (tvId: number, seasonNumber: number) => {
    setLoadingEpisodes(true)
    try {
      const response = await fetch(tmdbApi.getSeasonDetails(tvId, seasonNumber))
      const data = await response.json()
      setEpisodes(data.episodes || [])
    } catch (err) {
      console.error('Error fetching episodes:', err)
      setEpisodes([])
    }
    setLoadingEpisodes(false)
  }

  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber)
    if (movie) {
      loadEpisodes(movie.id, seasonNumber)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  const formatRuntime = (minutes: number | null): string => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handlePlay = (season?: number, episode?: number) => {
    if (!movie) return
    
    const mediaType = movie.media_type || 'movie'
    const params = new URLSearchParams({
      id: movie.id.toString(),
      type: mediaType,
      title: encodeURIComponent(movie.title),
      ...(mediaType === 'tv' && {
        season: season?.toString() || selectedSeason.toString(),
        episode: episode?.toString() || '1'
      })
    })

    router.push(`/player?${params.toString()}`)
  }

  if (!isOpen || !movie) return null

  const displayMovie = details || movie

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 pt-8 pb-8"
    >
      <div className="relative w-full max-w-4xl mx-4 bg-[#181818] rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-[#181818] flex items-center justify-center hover:bg-[#2f2f2f] transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Hero Section with Trailer */}
        <div className="relative aspect-video overflow-hidden">
          {/* Background Image */}
          <img
            src={displayMovie.backdrop}
            alt={displayMovie.title}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
              showTrailer && trailerKey ? "opacity-0" : "opacity-100"
            )}
          />
          
          {/* Trailer Video */}
          {showTrailer && trailerKey && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              allow="autoplay; encrypted-media"
              style={{ pointerEvents: 'none' }}
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />

          {/* Content over image/video */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            {(details?.logo) ? (
              <img 
                src={details.logo} 
                alt={displayMovie.title}
                className="h-16 md:h-24 w-auto mb-4 object-contain"
                style={{ maxWidth: '400px' }}
              />
            ) : (
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-balance">
                {displayMovie.title}
              </h1>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => handlePlay()}
                className="flex items-center gap-2 bg-white hover:bg-white/80 text-black font-semibold px-6 md:px-8 py-2 rounded transition-all"
              >
                <Play className="w-6 h-6 fill-black" />
                <span className="text-lg">Play</span>
              </button>

              <button className="w-11 h-11 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors bg-black/30 backdrop-blur-sm group">
                <Plus className="w-6 h-6 text-white" />
              </button>

              <button className="w-11 h-11 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors bg-black/30 backdrop-blur-sm group">
                <ThumbsUp className="w-5 h-5 text-white" />
              </button>

              <button className="w-11 h-11 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors bg-black/30 backdrop-blur-sm group">
                <ThumbsDown className="w-5 h-5 text-white" />
              </button>

              {trailerKey && (
                <div className="ml-auto">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-11 h-11 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors bg-black/30 backdrop-blur-sm"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-8 md:px-12 py-6">
          <div className="grid md:grid-cols-[2fr_1fr] gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Meta Info */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-500 font-semibold">{displayMovie.match}% Match</span>
                <span className="text-gray-400">{displayMovie.year}</span>
                <span className="border border-gray-500 px-1.5 py-0.5 text-xs text-gray-400">
                  {displayMovie.rating}
                </span>
                <span className="text-gray-400">{displayMovie.duration}</span>
                <span className="border border-gray-500 px-1 py-0.5 text-[10px] text-gray-400 rounded">
                  HD
                </span>
              </div>

              {/* Top 10 Badge */}
              {displayMovie.isTop10 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#e50914] px-2 py-1 rounded">
                    <span className="text-white font-bold text-sm">TOP</span>
                    <span className="text-white font-bold text-sm ml-1">10</span>
                  </div>
                  <span className="text-white text-sm font-medium">
                    #{displayMovie.top10Rank} in TV Shows Today
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-white/90 text-base leading-relaxed">{displayMovie.description}</p>
            </div>

            {/* Right Column */}
            <div className="space-y-4 text-sm">
              {displayMovie.cast && displayMovie.cast.length > 0 && (
                <div>
                  <span className="text-gray-500">Cast: </span>
                  <span className="text-white">{displayMovie.cast.join(", ")}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Genres: </span>
                <span className="text-white">{displayMovie.genres.join(", ")}</span>
              </div>
              {displayMovie.creator && (
                <div>
                  <span className="text-gray-500">Creator: </span>
                  <span className="text-white">{displayMovie.creator}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Episodes Section (for shows) */}
        {displayMovie.seasons && displayMovie.seasons > 0 && (
          <div className="px-8 md:px-12 py-6 border-t border-[#2f2f2f]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Episodes</h3>
              <select 
                className="bg-[#242424] border border-gray-600 text-white px-4 py-2 rounded text-sm"
                value={selectedSeason}
                onChange={(e) => handleSeasonChange(Number(e.target.value))}
              >
                {Array.from({ length: displayMovie.seasons }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Season {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Episode List */}
            {loadingEpisodes ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <div
                    key={episode.episode_number}
                    onClick={() => handlePlay(selectedSeason, episode.episode_number)}
                    className="flex gap-4 p-4 rounded hover:bg-[#2f2f2f] transition-colors cursor-pointer border-b border-[#2f2f2f]"
                  >
                    <div className="flex-shrink-0 w-8 text-2xl text-gray-500 flex items-center justify-center">
                      {episode.episode_number}
                    </div>
                    <div className="relative flex-shrink-0 w-32 aspect-video rounded overflow-hidden group">
                      <img
                        src={getImageUrl(episode.still_path, 'w300')}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium">{episode.name}</h4>
                        <span className="text-gray-400 text-sm">{formatRuntime(episode.runtime)}</span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {episode.overview || 'No description available'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* More Like This Section */}
        {similar.length > 0 && (
          <div className="px-8 md:px-12 py-6 border-t border-[#2f2f2f]">
            <h3 className="text-xl font-bold text-white mb-4">More Like This</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {similar.map((show, index) => (
                <div
                  key={index}
                  className="bg-[#2f2f2f] rounded overflow-hidden cursor-pointer hover:ring-1 hover:ring-white transition-all"
                >
                  <div className="relative aspect-video">
                    <img
                      src={show.backdrop}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="text-white font-semibold text-sm leading-tight line-clamp-1">
                      {show.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-500 font-semibold">{show.match}% Match</span>
                      <span className="text-gray-400">{show.year}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-3">
                      {show.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="px-8 md:px-12 py-6 border-t border-[#2f2f2f]">
          <h3 className="text-xl font-bold text-white mb-4">
            About <span className="font-normal">{displayMovie.title}</span>
          </h3>
          <div className="space-y-2 text-sm">
            {displayMovie.creator && (
              <div>
                <span className="text-gray-500">Creator: </span>
                <span className="text-white">{displayMovie.creator}</span>
              </div>
            )}
            {displayMovie.cast && displayMovie.cast.length > 0 && (
              <div>
                <span className="text-gray-500">Cast: </span>
                <span className="text-white">{displayMovie.cast.join(", ")}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Genres: </span>
              <span className="text-white">{displayMovie.genres.join(", ")}</span>
            </div>
            <div>
              <span className="text-gray-500">Maturity rating: </span>
              <span className="border border-gray-500 px-1.5 py-0.5 text-xs text-white mr-2">
                {displayMovie.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}