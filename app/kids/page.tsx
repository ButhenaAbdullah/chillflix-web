"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/netflix/navbar"
import { MovieRow } from "@/components/netflix/movie-row"
import { MovieModal } from "@/components/netflix/movie-modal"
import { Footer } from "@/components/netflix/footer"
import { tmdbApi, getKidsContent, GENRES_KIDS } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"

export default function KidsPage() {
  const router = useRouter()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)

  useEffect(() => {
    // Fetch kids content for the hero
    async function fetchHeroKids() {
      try {
        const kids = await getKidsContent()
        if (kids.length > 0) {
          setHeroMovie(kids[0])
        }
      } catch (err) {
        console.error('Error fetching kids content:', err)
      }
    }
    fetchHeroKids()

    // Initialize Ko-fi widget
    const script = document.createElement('script')
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
    script.async = true
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).kofiWidgetOverlay) {
        (window as any).kofiWidgetOverlay.draw('buthenaabdullah', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Tip Me',
          'floating-chat.donateButton.background-color': '#d9534f',
          'floating-chat.donateButton.text-color': '#fff'
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie)
  }

  const handleCloseModal = () => {
    setSelectedMovie(null)
  }

  const handlePlay = () => {
    if (!heroMovie) return
    
    const mediaType = heroMovie.media_type || 'movie'
    const params = new URLSearchParams({
      id: heroMovie.id.toString(),
      type: mediaType,
      title: encodeURIComponent(heroMovie.title),
      ...(mediaType === 'tv' && {
        season: '1',
        episode: '1'
      })
    })

    router.push(`/player?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Kids Hero Section */}
      {heroMovie && (
        <div className="relative h-[85vh] w-full">
          <img
            src={heroMovie.backdrop}
            alt={heroMovie.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          <div className="relative z-30 h-full flex flex-col justify-center px-4 md:px-14 pt-20 max-w-xl space-y-4">
            <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg w-fit mb-2">
              <span className="text-white font-bold text-lg">KIDS</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">{heroMovie.title}</h1>
            <p className="text-white/90 text-base md:text-lg line-clamp-3">{heroMovie.description}</p>
            
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={handlePlay}
                className="flex items-center gap-2 bg-white hover:bg-white/80 text-black font-semibold px-6 md:px-8 py-2 md:py-3 rounded transition-all"
              >
                <span className="text-lg md:text-xl">▶ Play</span>
              </button>
              <button
                onClick={() => handleOpenModal(heroMovie)}
                className="flex items-center gap-2 bg-gray-500/70 hover:bg-gray-500/50 text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded transition-all"
              >
                <span className="text-lg md:text-xl">ℹ More Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-30 -mt-3">
        <MovieRow 
          title="Popular Kids Shows" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', `with_genres=${GENRES_KIDS.ANIMATION}`)}&sort_by=popularity.desc`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Animated Movies" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', `with_genres=${GENRES_KIDS.ANIMATION}`)}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Fantasy Adventures" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', `with_genres=${GENRES_KIDS.FANTASY}`)}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Family Fun" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', 'with_genres=10751')}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Educational & Learning" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', `with_genres=${GENRES_KIDS.ANIMATION}`)}&with_keywords=education`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Animal Adventures" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', `with_genres=${GENRES_KIDS.ANIMATION}`)}&with_keywords=animals`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Fairy Tales & Magic" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', `with_genres=${GENRES_KIDS.FANTASY}`)}&sort_by=vote_average.desc`}
          onOpenModal={handleOpenModal}
        />
      </div>

      <Footer />

      <MovieModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={handleCloseModal}
      />
    </div>
  )
}