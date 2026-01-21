"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/netflix/navbar"
import { Hero } from "@/components/netflix/hero"
import { MovieRow } from "@/components/netflix/movie-row"
import { MovieModal } from "@/components/netflix/movie-modal"
import { Footer } from "@/components/netflix/footer"
import { tmdbApi, getTrendingAll } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"
export default function MoviesPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)

  useEffect(() => {
    // Fetch a trending movie for the hero
    async function fetchHeroMovie() {
      try {
        const all = await getTrendingAll()
        const movies = all.filter(m => m.media_type === 'movie')
        if (movies.length > 0) {
          setHeroMovie(movies[0])
        }
      } catch (err) {
        console.error('Error fetching hero movie:', err)
      }
    }
    fetchHeroMovie()
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
      
      <Hero onMoreInfo={handleOpenModal} mediaTypeFilter="movie" />

      <div className="relative z-30 -mt-3">
        <MovieRow 
          title="Top 10 Movies" 
          fetchUrl={tmdbApi.getTopRated()}
          isTop10={true}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Action Movies" 
          fetchUrl={tmdbApi.getActionMovies()}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Comedy Movies" 
          fetchUrl={tmdbApi.getComedyMovies()}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Horror Movies" 
          fetchUrl={tmdbApi.getHorrorMovies()}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Romance Movies" 
          fetchUrl={tmdbApi.getRomanceMovies()}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Documentaries" 
          fetchUrl={tmdbApi.getDocumentaries()}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Sci-Fi Movies" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', 'with_genres=878')}`}
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