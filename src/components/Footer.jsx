// src/components/Footer.jsx
import React from "react";

const NAME = "City Car Solution";
const ADDRESS = "Government Colony, Bandra East, Mumbai, Maharashtra, India";
const PHONE = "+91 9082552031";
const EMAIL = "citycarsolutionofficial@gmail.com";

export default function Footer() {
  return (
    <footer className="bg-[#0B162C] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Wrapper allows horizontal scroll on tiny screens so columns never stack */}
        <div className="overflow-x-auto -mx-4 px-4">
          {/* Force 4 columns always; min-w prevents collapsing to extremely narrow columns */}
          <div className="grid grid-cols-4 gap-8 min-w-[920px]">
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">{NAME}</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Professional Car Booking &amp; Chauffeur Service
              </p>
              <p className="mt-3 text-sm text-white/70">{ADDRESS}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm md:text-base">Contact</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-3">
                  <span className="text-rose-400">📞</span>
                  <a href={`tel:${PHONE}`} className="underline-offset-2 hover:underline">{PHONE}</a>
                </li>
                <li className="flex items-center gap-3">
                  <span>✉️</span>
                  <a href={`mailto:${EMAIL}`} className="underline-offset-2 hover:underline">{EMAIL}</a>
                </li>
                <li className="flex items-center gap-3">
                  <span>💬</span>
                  <a
                    href={`https://wa.me/91${PHONE.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    WhatsApp Chat
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm md:text-base">AI Support</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-3">
                  <span>🤖</span>
                  <a href="/support/user" className="hover:underline">User Support</a>
                </li>
                <li className="flex items-center gap-3">
                  <span>👨‍✈️</span>
                  <a href="/support/driver" className="hover:underline">Driver Support</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm md:text-base">Services</h4>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-center gap-2">
                  <span>🛫</span>
                  <a href="#services" className="hover:underline">Airport Transfers</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>🏙️</span>
                  <a href="#services" className="hover:underline">Local City Rentals</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>🚗</span>
                  <a href="#services" className="hover:underline">Outstation — One Way / Round Trip</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>⏱️</span>
                  <a href="#services" className="hover:underline">Hourly / Daily Car Hire</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-sm text-white/70 gap-3">
          <div>© {new Date().getFullYear()} {NAME}. All Rights Reserved.</div>
          <div className="text-xs">Developed by City Car Solution</div>
        </div>
      </div>
    </footer>
  );
}
