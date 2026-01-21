"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/netflix/navbar"
import { Hero } from "@/components/netflix/hero"
import { MovieRow } from "@/components/netflix/movie-row"
import { MovieModal } from "@/components/netflix/movie-modal"
import { Footer } from "@/components/netflix/footer"
import { tmdbApi, getTrendingAll, convertTMDBToMovie } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"

export default function TVShowsPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)

  useEffect(() => {
    // Fetch a trending TV show for the hero
    async function fetchHeroTV() {
      try {
        const all = await getTrendingAll()
        const tvShows = all.filter(m => m.media_type === 'tv')
        if (tvShows.length > 0) {
          setHeroMovie(tvShows[0])
        }
      } catch (err) {
        console.error('Error fetching hero TV:', err)
      }
    }
    fetchHeroTV()
  }, [])

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie)
  }

  const handleCloseModal = () => {
    setSelectedMovie(null)
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <Hero onMoreInfo={handleOpenModal} mediaTypeFilter="tv" />

      <div className="relative z-30 -mt-3">
        <MovieRow 
          title="Top 10 TV Shows" 
          fetchUrl={`${tmdbApi.getTrending()}`}
          isTop10={true}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Netflix Originals" 
          fetchUrl="netflix-originals"
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Drama Series" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', 'with_genres=18')}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Comedy Series" 
          fetchUrl={`${tmdbApi.getComedyMovies().replace('/discover/movie', '/discover/tv')}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Action & Adventure" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv')}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Crime TV Shows" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', 'with_genres=80')}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Mystery & Thriller" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', 'with_genres=9648')}`}
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