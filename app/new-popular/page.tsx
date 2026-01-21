"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/netflix/navbar"
import { Hero } from "@/components/netflix/hero"
import { MovieRow } from "@/components/netflix/movie-row"
import { MovieModal } from "@/components/netflix/movie-modal"
import { Footer } from "@/components/netflix/footer"
import { tmdbApi, getTrendingAll } from "@/lib/tmdb"
import type { Movie } from "@/lib/tmdb"

export default function NewPopularPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)

  useEffect(() => {
    // Fetch the latest trending content for the hero
    async function fetchHeroContent() {
      try {
        const all = await getTrendingAll()
        if (all.length > 0) {
          // Sort by year to get the newest
          const sorted = all.sort((a, b) => {
            const yearA = parseInt(a.year) || 0
            const yearB = parseInt(b.year) || 0
            return yearB - yearA
          })
          setHeroMovie(sorted[0])
        }
      } catch (err) {
        console.error('Error fetching hero content:', err)
      }
    }
    fetchHeroContent()
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
      
      <Hero onMoreInfo={handleOpenModal} mediaTypeFilter="all" />

      <div className="relative z-30 -mt-3">
        <MovieRow 
          title="New Releases" 
          fetchUrl={`${tmdbApi.getTrending()}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Popular Movies" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', '')}&sort_by=popularity.desc`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Popular TV Shows" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('/discover/movie', '/discover/tv').replace('with_genres=28', '')}&sort_by=popularity.desc`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Coming Soon" 
          fetchUrl={`${tmdbApi.getActionMovies().replace('with_genres=28', '')}&primary_release_date.gte=${new Date().toISOString().split('T')[0]}&sort_by=popularity.desc`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Worth the Wait" 
          fetchUrl={`${tmdbApi.getTopRated()}`}
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="New on Netflix" 
          fetchUrl="netflix-originals"
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Trending This Week" 
          fetchUrl={`${tmdbApi.getTrending().replace('/week', '/day')}`}
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