"use client"

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

export function Footer() {
  const footerLinks = {
    company: ["About Us", "Jobs", "Press", "Blog"],
    support: ["Help Center", "Contact Us", "Legal Notices", "Privacy"],
    services: ["Gift Cards", "Media Center", "Investor Relations", "Terms of Use"]
  }

  return (
    <footer className="relative px-4 md:px-14 py-16 mt-16 bg-gradient-to-t from-black via-gray-900/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Social Links */}
        <div className="flex items-center gap-6 mb-10">
          {/* <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
            aria-label="Facebook"
          >
            <Facebook className="w-7 h-7" />
          </a> */}
          <a 
            href="https://www.instagram.com/_r6xyl/" 
            className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
            aria-label="Instagram"
          >
            <Instagram className="w-7 h-7" />
          </a>
          {/* <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
            aria-label="Twitter"
          >
            <Twitter className="w-7 h-7" />
          </a>
          <a 
            href="#" 
            className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110"
            aria-label="YouTube"
          >
            <Youtube className="w-7 h-7" />
          </a> */}
        </div>

        {/* Links Grid */}
        {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-sm font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div> */}

        {/* Divider */}
        <div className="border-t border-gray-800 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-gray-500 text-xs">
            © 2026 Chillflix, Inc. All rights reserved.
          </p>
          
          <div className="flex gap-4 text-xs">
            <a href="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              Cookie Preferences
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              Corporate Information
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}