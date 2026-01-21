"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, Bell, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", path: "/" },
    { name: "TV Shows", path: "/tv-shows" },
    { name: "Movies", path: "/movies" },
    { name: "New & Popular", path: "/new-popular" },
  ]

  const handleSearchClick = () => {
    router.push('/search')
  }

  const handleKidsClick = () => {
    router.push('/kids')
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "bg-[#000000]" : "bg-gradient-to-b from-black/80 via-black/50 to-transparent"
      )}
    >
      <div className="flex items-center justify-between px-4 md:px-14 py-3">
        {/* Left side */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Netflix Logo */}
          <a href="/">
            <img src="/splash.png" alt="Netflix" width={150} className="cursor-pointer" />
          </a>

          {/* Nav Items */}
          <ul className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={item.path}
                  className={cn(
                    "text-sm transition-colors hover:text-gray-300",
                    isActive(item.path) ? "font-semibold text-white" : "text-[#e5e5e5]"
                  )}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Menu */}
          <div className="md:hidden relative">
            <button className="flex items-center gap-1 text-sm">
              Browse <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search Button */}
          <button onClick={handleSearchClick}>
            <Search className="w-5 h-5 text-white cursor-pointer hover:text-gray-300 transition" />
          </button>

          {/* Kids */}
          <span 
            onClick={handleKidsClick}
            className={cn(
              "hidden md:block text-sm cursor-pointer hover:text-gray-300 transition",
              pathname === '/kids' ? "font-semibold text-white" : "text-[#e5e5e5]"
            )}
          >
            Kids
          </span>

          {/* Notifications */}
          <div className="relative">
            <Bell className="w-5 h-5 text-white cursor-pointer" />
          </div>

          {/* Profile */}
          <div
            className="relative flex items-center gap-1 cursor-pointer"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
              alt="Profile"
              className="w-8 h-8 rounded"
            />
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                showProfileMenu ? "rotate-180" : ""
              )}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}