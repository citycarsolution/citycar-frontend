import React from "react";

// src/components/Header.jsx
// TailwindCSS-based header matching the provided screenshot.
// Usage: place <Header /> at top of your app. Ensure Tailwind is configured.

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-b from-[#0b162c] to-[#0b1726] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* left: logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#1f2937] to-[#111827] shadow-inner">
              {/* small car SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-pink-400 fill-current" aria-hidden>
                <path d="M3 11l1.5-3.5A2 2 0 0 1 6.3 6h11.4a2 2 0 0 1 1.8 1.5L21 11v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5zM6.5 9.5A.5.5 0 0 0 6 10v1h12v-1a.5.5 0 0 0-.5-.5H6.5zM7 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-lg">City Car Solution</div>
              <div className="text-gray-300 text-xs">Professional Car Booking</div>
            </div>
          </div>

          {/* center: nav links (hidden on very small screens) */}
          <nav className="hidden md:flex gap-6 items-center text-sm text-gray-200">
            <a href="#home" className="hover:text-white transition">Home</a>
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </nav>

          {/* right: phone pill + whatsapp button */}
          <div className="flex items-center gap-3">
            <a href="tel:+919082552031" className="hidden sm:flex items-center gap-2 bg-[#1f2a3a] px-3 py-2 rounded-md shadow-sm border border-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5l-5.2-1.4a1 1 0 0 0-1 .3l-2.2 2.2a15 15 0 0 1-6.1-6.1l2.2-2.2a1 1 0 0 0 .3-1L7.5 3H5a2 2 0 0 0-2 2C3 17 21 21 21 16.5z"/></svg>
              <span className="text-sm text-white">+91 9082552031</span>
            </a>

            <a href="https://wa.me/919082552031" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-md focus:outline-none transform transition hover:-translate-y-0.5" style={{background: 'linear-gradient(90deg,#ff5778,#ff7a9b)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="#fff"><path d="M20.5 3.5A11 11 0 1 0 22 12.1l-1.3 4.6-4.7-1.2A10.8 10.8 0 0 0 20.5 3.5zM7.5 9.5c.1 0 .6-.1.9-.2.2-.1.5-.2.7.1l.9 1.1c.2.2.2.5.1.8-.1.4-.3 1.3.2 2 .5.7 1.7 2.7 4.2 3.8 1 .5 1.6.3 2 .2.4-.1 1.1-.4 1.2-.8.1-.3.8-1.1.9-1.3.1-.2.1-.5-.1-.7l-1-1.6c-.1-.2-.3-.4-.5-.4-.2-.1-.4 0-.6.1-.2.2-.6.6-.8.8-.2.2-.4.2-.7.1-.3-.1-.9-.3-1.7-.9-.8-.6-1.3-1.2-1.6-1.6-.3-.4-.1-.6.1-.8l.8-1.1c.2-.3.2-.6.1-.8-.1-.2-.7-.5-1-.5-.3 0-.8 0-1.2.4-.5.5-1.2 1.1-1.2 1.1s-.5.4-.1.8z"/></svg>
              <span className="text-white">Book on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* thin bottom border to separate from page */}
      <div className="h-[1px] bg-white/5" />
    </header>
  );
}
