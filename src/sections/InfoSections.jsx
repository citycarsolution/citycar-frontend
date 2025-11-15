// src/sections/InfoSections.jsx
import React from "react";

/** ---- Brand (edit as you like) ---- */
const BRAND = {
  name: "City Car Solution",
  colors: {
    navy: "#0B162C",
    navySoft: "#111A32",
    accent: "#E11D48",
    textOnNavy: "#FFFFFF",
  },
};

/** ---- Cards ---- */
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border bg-white p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

/** ---- How it works ---- */
const HowItWorks = () => {
  const steps = [
    { no: 1, title: "Choose Service", desc: "Airport, Local, One-Way ya Round Trip select karein.", icon: "🧭" },
    { no: 2, title: "Enter Details", desc: "Pickup/Drop, date & time fill karein.", icon: "📝" },
    { no: 3, title: "Get Fare", desc: "Estimated distance se instant fare dikhega.", icon: "💰" },
    { no: 4, title: "Confirm & Ride", desc: "Driver assign hote hi WhatsApp/SMS aata hai.", icon: "✅" },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <header className="text-center mb-8">
        <h2 className="text-2xl font-bold">How it works</h2>
        <p className="text-sm text-gray-600">4 simple steps — 1 minute booking</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <Card key={s.no}>
            <div className="text-3xl" aria-hidden>{s.icon}</div>
            <div className="mt-2 text-xs uppercase tracking-wide opacity-70">Step {s.no}</div>
            <div className="text-lg font-semibold">{s.title}</div>
            <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

/** ---- About us ---- */
const AboutUs = () => (
  <section className="max-w-6xl mx-auto px-4 py-12">
    <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
      <div
        className="px-6 py-4"
        style={{ backgroundColor: BRAND.colors.navy, color: BRAND.colors.textOnNavy }}
      >
        <h2 className="text-lg font-semibold">About {BRAND.name}</h2>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <img
          src="/about-fleet.jpg"
          alt="Our cabs"
          className="rounded-xl w-full object-cover aspect-[16/10] bg-gray-100"
        />
        <div>
          <p className="text-gray-700 leading-relaxed">
            {BRAND.name} Mumbai based professional cab service hai — Airport transfers, City rentals
            aur Outstation trips ke liye clean AC cars, verified drivers aur transparent pricing.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>✅ 24×7 Booking Support (Call/WhatsApp)</li>
            <li>✅ Fixed & Fair Prices — no hidden charges</li>
            <li>✅ Experienced, polite & punctual drivers</li>
            <li>✅ Instant confirmation & live updates</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

/** ---- Services ---- */
const ServicesGrid = () => {
  const SERVICES = [
    {
      icon: "✈️",
      title: "Airport Transfers",
      points: ["Pick/Drop all Mumbai airports", "Free wait time window", "Toll & Parking at actuals"],
    },
    {
      icon: "🏙️",
      title: "Local Rentals",
      points: ["8H/80KM • 12H/120KM", "Extra km/hr clear", "Billing: Pick-up to Pick-up"],
    },
    {
      icon: "🚗",
      title: "Outstation One-Way",
      points: ["One side fare only", "Clean AC Sedan/SUV", "Door-to-door service"],
    },
    {
      icon: "🔄",
      title: "Outstation Round Trip",
      points: ["Min 300km/day", "Driver allowance per day", "Flexible itinerary"],
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <header className="text-center mb-8">
        <h2 className="text-2xl font-bold">Our Services</h2>
        <p className="text-sm text-gray-600">Choose what fits your trip</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s) => (
          <Card key={s.title}>
            <div className="text-3xl">{s.icon}</div>
            <div className="mt-2 text-lg font-semibold">{s.title}</div>
            <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc list-inside">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
};

/** ---- Why choose us ---- */
const WhyChooseUs = () => {
  const items = [
    { icon: "🛡️", title: "Trusted & Safe", desc: "Verified drivers, GPS tracked rides." },
    { icon: "💳", title: "Transparent Pricing", desc: "No hidden charges — clear breakup." },
    { icon: "🧼", title: "Clean Cars", desc: "Regularly sanitized, well maintained fleet." },
    { icon: "⏱️", title: "On-time Pickup", desc: "We respect your time — always punctual." },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div
        className="rounded-3xl p-6 md:p-10 text-white"
        style={{
          background: `linear-gradient(135deg, ${BRAND.colors.navy} 0%, ${BRAND.colors.navySoft} 100%)`,
        }}
      >
        <h2 className="text-2xl font-bold">Why choose {BRAND.name}?</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.title} className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl" aria-hidden>
                {it.icon}
              </div>
              <div className="mt-2 font-semibold">{it.title}</div>
              <div className="text-sm opacity-90">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/** ---- Wrapper (use this one) ---- */
export default function InfoSections() {
  return (
    <>
      <HowItWorks />
      <AboutUs />
      <ServicesGrid />
      <WhyChooseUs />
    </>
  );
}
