"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/netflix/navbar"
import { Hero } from "@/components/netflix/hero"
import { MovieRow } from "@/components/netflix/movie-row"
import { MovieModal } from "@/components/netflix/movie-modal"
import { Footer } from "@/components/netflix/footer"
import type { Movie } from "@/lib/tmdb"
import { tmdbApi } from "@/lib/tmdb"

export default function MainPage() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
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
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // انتظر حتى تنتهي الـ animation قبل إزالة الفيلم
    setTimeout(() => setSelectedMovie(null), 300)
  }

  return (
    <div className="bg-[#000000] min-h-screen">
      {/* Add global styles for scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <Navbar />
      <div className="mb-10">
        <Hero onMoreInfo={handleOpenModal} />
      </div>

      {/* Movie Rows */}
      <div className="relative -mt-2 z-30 space-y-8 pb-16">
        <MovieRow 
          title="Trending Now" 
          fetchUrl={tmdbApi.getTrending()} 
          onOpenModal={handleOpenModal}
        />
        
        <MovieRow 
          title="Top 10 in Your Country Today" 
          fetchUrl={tmdbApi.getTopRated()} 
          isTop10={true}
          onOpenModal={handleOpenModal}
        />

        {/* Netflix Originals - استخدام الدالة الجديدة */}
        <MovieRow 
          title="Netflix Originals" 
          fetchUrl="netflix-originals"
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
      </div>

      <Footer />

      {/* Movie Modal */}
      <MovieModal 
        movie={selectedMovie} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
      />
    </div>
  )
}