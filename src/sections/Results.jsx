import React, { useEffect, useMemo, useState } from "react";

const PRICE = {
  airport: {
    sedan:  { baseKm: 10, baseFare: 750,  extraPerKm: 15, waitFreeMin: 60,  waitPerMin: 2.5 },
    ertiga: { baseKm: 10, baseFare: 1050,  extraPerKm: 18, waitFreeMin: 60,  waitPerMin: 3.5 },
    carens: { baseKm: 10, baseFare: 1250,  extraPerKm: 20, waitFreeMin: 60,  waitPerMin: 3 },
    crysta: { baseKm: 40, baseFare: 2250, extraPerKm: 25, waitFreeMin: 240, waitPerMin: 5, baseIsHours: true },
    note: "Billing from Pick-up to Pick-up. Toll & parking extra.",
  },
  city: {
    "8x80": {
      sedan:   { baseKm: 80,  baseHr: 8,  baseFare: 2200, extraPerKm: 13, extraPerHr: 130 },
      ertiga:  { baseKm: 80,  baseHr: 8,  baseFare: 2700, extraPerKm: 17, extraPerHr: 170 },
      carens:  { baseKm: 80,  baseHr: 8,  baseFare: 3000, extraPerKm: 18, extraPerHr: 180 },
      crysta:  { baseKm: 80,  baseHr: 8,  baseFare: 3500, extraPerKm: 22, extraPerHr: 220 },
      hycross: { baseKm: 80,  baseHr: 8,  baseFare: 4000, extraPerKm: 30, extraPerHr: 300 },
      fortuner:{ baseKm: 80,  baseHr: 8,  baseFare: 6500, extraPerKm: 35, extraPerHr: 350, g2g: true },
    },
    "12x120": {
      sedan:   { baseKm: 120, baseHr: 12, baseFare: 3200, extraPerKm: 13, extraPerHr: 130 },
      ertiga:  { baseKm: 120, baseHr: 12, baseFare: 4000, extraPerKm: 17, extraPerHr: 170 },
      carens:  { baseKm: 120, baseHr: 12, baseFare: 4400, extraPerKm: 18, extraPerHr: 180 },
      crysta:  { baseKm: 120, baseHr: 12, baseFare: 5200, extraPerKm: 22, extraPerHr: 220 },
      hycross: { baseKm: 120, baseHr: 12, baseFare: 6400, extraPerKm: 30, extraPerHr: 300 },
      fortuner:{ baseKm: 120, baseHr: 12, baseFare: 9300, extraPerKm: 35, extraPerHr: 350, g2g: true },
    },
    driverAllowanceAfterMidnight: 300,
  },
  oneway: {
    sedan:  { baseKm: 100, baseFare: 2000, extraPerKm: 15 },
    ertiga: { baseKm: 100, baseFare: 2750, extraPerKm: 20 },
    carens: { baseKm: 100, baseFare: 3000, extraPerKm: 22 },
    crysta: { baseKm: 100, baseFare: 4250, extraPerKm: 25 },
  },
  roundtrip: {
    perKm: { sedan: 13, ertiga: 17, carens: 18, crysta: 22, hycross: 27 },
    driverAllowance: { default: 400, premium: 500 },
    dailyMinKm: 300,
  },
};

// car data
const CARS = [
  { id: "sedan",    title: "Sedan — Dzire / Xcent",  seats: "4 + 1", img: "/cars/sedan.png",    description: "AC C: 0.14 - 1" },
  { id: "ertiga",   title: "SUV — Ertiga / Enjoy",   seats: "5 + 1", img: "/cars/ertiga.jpg",   description: "AC C: 0.15 - 1" },
  { id: "carens",   title: "SUV — Kia Carens",       seats: "5 + 1", img: "/cars/carens.jpg",   description: "Premium SUV" },
  { id: "crysta",   title: "SUV — Innova Crysta",    seats: "5 + 1", img: "/cars/crysta.jpg",   description: "Premium SUV" },
  { id: "hycross",  title: "SUV — Innova Hycross",   seats: "5 + 1", img: "/cars/hycross.jpg",  description: "Premium SUV" },
  { id: "fortuner", title: "SUV — Fortuner",         seats: "5 + 1", img: "/cars/Fortuner.jpg", description: "Luxury SUV" },
];

const premium = (id) => id === "crysta" || id === "hycross" || id === "fortuner";
const toFixedMoney = (n) => n.toLocaleString("en-IN");

/* ---------- helpers ---------- */
function haversineKm(a, b) {
  if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * d2r, dLon = (b.lon - a.lon) * d2r;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * d2r) *
      Math.cos(b.lat * d2r) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}
function dynamicRoadMultiplier(airKm) {
  if (airKm <= 0 || !isFinite(airKm)) return 1.3;
  if (airKm < 12) return 1.6;
  if (airKm < 25) return 1.45;
  if (airKm < 60) return 1.35;
  return 1.25;
}
function kmFromSelections(pickup, drop) {
  const d = haversineKm(pickup, drop);
  if (!d) return null;
  return Math.round(d * dynamicRoadMultiplier(d));
}
function daysBetweenInclusive(startISO, endISO) {
  const a = new Date(startISO);
  const b = new Date(endISO || startISO);
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  const d = Math.floor(ms / 86400000) + 1;
  return d < 1 ? 1 : d;
}
function formatClock(isoDate, hhmm, plusMinutes) {
  try {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    const d = new Date(
      `${isoDate}T${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}:00`
    );
    d.setMinutes(d.getMinutes() + (plusMinutes || 0));
    let hr = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const am = hr < 12 ? "am" : "pm";
    hr = hr % 12 || 12;
    return `${String(hr).padStart(2, "0")}:${min} ${am}`;
  } catch {
    return "";
  }
}
function prettyDuration(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  if (r === 0) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h}h ${String(r).padStart(2, "0")}m`;
}
function avgSpeedKmph(service, tripType) {
  if (service === "airport") return 28;
  if (service === "local") return 20;
  if (service === "outstation" && tripType === "oneway") return 55;
  if (service === "outstation" && tripType === "roundtrip") return 50;
  return 30;
}

const FALLBACK_IMAGES = {
  sedan: "https://via.placeholder.com/112x80/3B82F6/FFFFFF?text=Sedan",
  ertiga: "https://via.placeholder.com/112x80/10B981/FFFFFF?text=Ertiga",
  carens: "https://via.placeholder.com/112x80/EF4444/FFFFFF?text=Carens",
  crysta: "https://via.placeholder.com/112x80/8B5CF6/FFFFFF?text=Crysta",
  hycross: "https://via.placeholder.com/112x80/F59E0B/FFFFFF?text=Hycross",
  fortuner: "https://via.placeholder.com/112x80/22C55E/FFFFFF?text=Fortuner",
};

export default function Results({
  searchParams,
  onBack,
  onSelect,
  initialService,
  initialPackageId,
}) {
  const service = searchParams?.service || initialService || "airport";
  const airportMode = searchParams?.airportMode || "drop";

  // --- Local package key detect (8x80 vs 12x120) ---
  const getCityPackageKey = () => {
    const pkgRaw = (
      searchParams?.package ||
      searchParams?.packageId ||
      initialPackageId ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();

    if (!pkgRaw) return "8x80";
    if (pkgRaw === "12x120" || pkgRaw === "12h" || pkgRaw === "12")
      return "12x120";
    if (pkgRaw === "8x80" || pkgRaw === "8h" || pkgRaw === "8") return "8x80";
    if (pkgRaw.includes("12") || pkgRaw.includes("120")) return "12x120";
    return "8x80";
  };

  const cityPackKey = useMemo(
    getCityPackageKey,
    [searchParams?.package, searchParams?.packageId, initialPackageId]
  );

  /* auto distance */
  const autoKm = useMemo(() => {
    if (service === "airport") {
      return airportMode === "drop"
        ? kmFromSelections(searchParams?.pickup, searchParams?.airport)
        : kmFromSelections(searchParams?.airport, searchParams?.drop);
    }
    if (service === "outstation") {
      if (searchParams?.tripType === "oneway")
        return kmFromSelections(searchParams?.pickup, searchParams?.drop);
      if (searchParams?.tripType === "roundtrip") {
        const oneSide = kmFromSelections(
          searchParams?.pickup,
          searchParams?.drop
        );
        return oneSide ? oneSide * 2 : null;
      }
    }
    return null;
  }, [service, airportMode, searchParams]);

  const [km, setKm] = useState(autoKm ?? 0);
  useEffect(() => {
    if (autoKm !== null && autoKm !== undefined) setKm(autoKm);
  }, [autoKm]);

  const estimatedTravelMin = useMemo(() => {
    const speed = avgSpeedKmph(service, searchParams?.tripType);
    if (!km || km <= 0) return 0;
    return Math.round((km / Math.max(1, speed)) * 60);
  }, [km, service, searchParams?.tripType]);

  const [arrivalDelayMin, setArrivalDelayMin] = useState(0);
  const [touchedDelay, setTouchedDelay] = useState(false);
  useEffect(() => {
    if (!touchedDelay) setArrivalDelayMin(estimatedTravelMin);
  }, [estimatedTravelMin, touchedDelay]);

  const arrivalClock = useMemo(
    () =>
      formatClock(
        searchParams?.pickupDate,
        searchParams?.pickupTime,
        arrivalDelayMin
      ),
    [searchParams, arrivalDelayMin]
  );

  const days = useMemo(() => {
    if (service === "outstation" && searchParams?.tripType === "roundtrip")
      return daysBetweenInclusive(
        searchParams?.pickupDate,
        searchParams?.returnDate
      );
    return 1;
  }, [service, searchParams]);

  /* ---------- pricing ---------- */
  function priceAirport(carId) {
    const cfg = PRICE.airport[carId];
    if (!cfg) return null;
    const effectiveKm = Math.max(0, km || 0);
    const extraKm = Math.max(0, effectiveKm - cfg.baseKm);
    const distanceFare = cfg.baseFare + extraKm * cfg.extraPerKm;
    const extraWait = Math.max(0, (arrivalDelayMin || 0) - cfg.waitFreeMin);
    const waitFare = extraWait > 0 ? Math.ceil(extraWait) * cfg.waitPerMin : 0;
    const total = distanceFare + waitFare;
    return { total, distanceFare, waitFare, extraKm, cfg };
  }

  function priceCity(carId) {
    const cfg = PRICE.city[cityPackKey]?.[carId];
    if (!cfg) return null;
    const meta = {
      packageKey: cityPackKey,
      packageHours: cfg.baseHr || (cityPackKey === "12x120" ? 12 : 8),
      packageKm: cfg.baseKm || (cityPackKey === "12x120" ? 120 : 80),
    };
    return { total: cfg.baseFare, cfg, meta };
  }

  function priceOneWay(carId) {
    const cfg = PRICE.oneway[carId];
    if (!cfg) return null;
    const effectiveKm = Math.max(cfg.baseKm, km || 0);
    const extraKm = Math.max(0, effectiveKm - cfg.baseKm);
    const total = cfg.baseFare + extraKm * cfg.extraPerKm;
    return { total, cfg, effectiveKm, extraKm };
  }

  function priceRoundTrip(carId) {
    const perKm = PRICE.roundtrip.perKm[carId];
    if (!perKm) return null;
    const minKm = PRICE.roundtrip.dailyMinKm * days;
    const actualKm = Math.max(0, km || 0);
    const billableKm = Math.max(minKm, actualKm);
    const kmFare = billableKm * perKm;
    const daPerDay = premium(carId)
      ? PRICE.roundtrip.driverAllowance.premium
      : PRICE.roundtrip.driverAllowance.default;
    const daTotal = daPerDay * days;
    const total = kmFare + daTotal;
    return { total, kmFare, daTotal, perKm, billableKm, days, daPerDay };
  }

  function fareFor(carId) {
    if (service === "airport") return priceAirport(carId);
    if (service === "local") return priceCity(carId);
    if (service === "outstation" && searchParams?.tripType === "oneway")
      return priceOneWay(carId);
    if (service === "outstation" && searchParams?.tripType === "roundtrip")
      return priceRoundTrip(carId);
    return null;
  }

  const headerLine = useMemo(() => {
    if (service === "airport") {
      const left =
        airportMode === "drop"
          ? searchParams?.pickup?.label || "Pick-up"
          : searchParams?.airport?.label || "Airport";
      const right =
        airportMode === "drop"
          ? searchParams?.airport?.label || "Airport"
          : searchParams?.drop?.label || "Drop";
      return `From: ${left} · To: ${right}`;
    }
    if (service === "outstation")
      return `From: ${searchParams?.pickup?.label || "From"} · To: ${
        searchParams?.drop?.label || "To"
      } (${searchParams?.tripType === "roundtrip" ? "Round Trip" : "One Way"})`;
    if (service === "local") {
      const lbl = cityPackKey === "12x120" ? "12H/120KM" : "8H/80KM";
      return `${searchParams?.pickup?.label || "City"} · ${lbl}`;
    }
    return "Search Results";
  }, [service, airportMode, searchParams, cityPackKey]);

  const subNote = useMemo(() => {
    if (service === "airport")
      return "Sedan: ₹2/min after 60m · Ertiga/Kia Carens: ₹3/min after 60m · Crysta: after 4h ₹5/min (toll/parking extra).";
    if (service === "outstation" && searchParams?.tripType === "roundtrip")
      return `Min ${PRICE.roundtrip.dailyMinKm}km/day • Driver ₹${PRICE.roundtrip.driverAllowance.default}/day (Crysta/Hycross ₹${PRICE.roundtrip.driverAllowance.premium}/day)`;
    if (service === "outstation" && searchParams?.tripType === "oneway")
      return `Min billable ${PRICE.oneway.sedan.baseKm}km • Sedan extra ₹15/km (SUVs higher)`;
    if (service === "local")
      return `Billing from Pick-up to Pick-up • DA after midnight ₹${PRICE.city.driverAllowanceAfterMidnight}`;
    return "";
  }, [service, searchParams, cityPackKey]);

  const [openId, setOpenId] = useState(null);
  const handleImageError = (e, carId) => {
    e.target.src = FALLBACK_IMAGES[carId];
  };

  return (
    <section className="w-full min-h-screen flex justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Main Container - Now 80% width on laptop */}
      <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                City Car Solution
              </h1>
              <p className="text-lg text-slate-600 mb-3">Professional Car Booking</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <span>Home</span>
                <span>Services</span>
                <span>Pricing</span>
                <span>Contact</span>
                <span className="font-semibold text-blue-600">+91 9082552031</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Change Search
              </button>
              <button className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-lg">
                Book on WhatsApp
              </button>
            </div>
          </div>

          {/* Location Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">Bandipora, Jammu and Kashmir, India - 8H/80KM</p>
                <p className="text-sm text-slate-600">Billing from Pick-up to Pick-up. Toll & parking extra.</p>
                {service === "local" && (
                  <p className="text-sm text-emerald-700 font-medium mt-1">
                    Package: {cityPackKey === "12x120" ? "12 hours / 120 KM" : "8 hours / 80 KM"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Grid - Improved for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Distance Input */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Estimated distance (km)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={km ?? 0}
              onChange={(e) => setKm(Number(e.target.value) || 0)}
              className="w-full p-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
              placeholder="Enter distance"
            />
            <p className="text-sm text-slate-500 mt-3">
              {autoKm !== null ? (
                <span className="text-green-600 font-medium">✓ Auto from map • Fixed (No edit)</span>
              ) : (
                "No map coordinates — type approximate km"
              )}
            </p>
          </div>

          {/* Arrival Delay */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Arrival delay (minutes)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={arrivalDelayMin}
              onChange={(e) => {
                setTouchedDelay(true);
                setArrivalDelayMin(Number(e.target.value) || 0);
              }}
              className="w-full p-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
            />
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                ≈ {prettyDuration(estimatedTravelMin)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTouchedDelay(false);
                  setArrivalDelayMin(estimatedTravelMin);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
              >
                Use estimated time
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Arrival time: <span className="font-semibold">{arrivalClock || "—"}</span>
            </p>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Important Notes
            </label>
            <div className="text-sm text-slate-700 leading-relaxed bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              {subNote}
            </div>
          </div>
        </div>

        {/* Cars Grid - Responsive for Desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {CARS.map((car) => {
            const fare = fareFor(car.id);
            if (!fare) return null;
            const airportCfg = PRICE.airport[car.id];
            const isOpen = openId === car.id;

            const displayTotal = fare.total ?? 0;
            const packMeta = fare.meta || null;

            return (
              <div
                key={car.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Car Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={car.img}
                      alt={car.title}
                      className="w-32 h-24 lg:w-40 lg:h-28 object-cover rounded-xl border-2 border-slate-200 bg-slate-50"
                      onError={(e) => handleImageError(e, car.id)}
                    />
                  </div>

                  {/* Car Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {car.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <span>{car.description}</span>
                          <span>•</span>
                          <span>Seats: {car.seats}</span>
                        </div>

                        {/* Service Specific Details */}
                        {service === "airport" && airportCfg && (
                          <p className="text-sm text-slate-700 bg-blue-50 px-3 py-2 rounded-lg">
                            Base {airportCfg.baseKm}
                            {airportCfg.baseIsHours ? " (4h/40km)" : "km"} • Extra ₹
                            {airportCfg.extraPerKm}/km • After{" "}
                            {airportCfg.waitFreeMin /
                              (airportCfg.baseIsHours ? 60 : 1)}
                            {airportCfg.baseIsHours ? "h" : "m"}: ₹
                            {airportCfg.waitPerMin}/min
                          </p>
                        )}

                        {service === "local" && (
                          <p className="text-sm text-slate-700 bg-green-50 px-3 py-2 rounded-lg">
                            Includes base hours & kms • Extra km/hr as per car • 
                            Package: {packMeta?.packageKey || cityPackKey}
                          </p>
                        )}

                        {/* Fare Detail Toggle */}
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? null : car.id)}
                          className="mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                        >
                          View Fare Details
                          <span className="text-lg">{isOpen ? "▴" : "▾"}</span>
                        </button>
                      </div>

                      {/* Price and Book Button */}
                      <div className="text-center lg:text-right flex-shrink-0">
                        <div className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
                          ₹ {toFixedMoney(Math.round(displayTotal))}
                        </div>
                        <button
                          onClick={() => {
                            const payload = {
                              carId: car.id,
                              fare,
                              service,
                              km,
                              arrivalDelayMin,
                              days,
                              ...(service === "local" && packMeta
                                ? {
                                    packageKey: packMeta.packageKey,
                                    packageHours: packMeta.packageHours,
                                    packageKm: packMeta.packageKm,
                                  }
                                : {}),
                            };
                            onSelect?.(payload);
                          }}
                          className="px-8 py-3 rounded-xl text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                        >
                          Book Now
                        </button>
                        <div className="text-sm text-slate-500 mt-2">
                          ETA: {prettyDuration(arrivalDelayMin)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-slate-200 bg-slate-50">
                    <div className="pt-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Fare Breakdown:</h4>
                      
                      {service === "airport" && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                            <span>Base fare ({airportCfg.baseKm}km):</span>
                            <span className="font-semibold">₹{airportCfg.baseFare}</span>
                          </div>
                          {fare.extraKm > 0 && (
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <span>Extra km ({fare.extraKm} × ₹{airportCfg.extraPerKm}):</span>
                              <span className="font-semibold">₹{(fare.extraKm * airportCfg.extraPerKm).toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {fare.waitFare > 0 && (
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                              <span>Waiting charges:</span>
                              <span className="font-semibold">₹{fare.waitFare.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inclusions & Exclusions */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white rounded-xl p-4 border border-green-200">
                          <h5 className="font-semibold text-green-800 mb-2">✅ Inclusions</h5>
                          <ul className="text-sm text-slate-700 space-y-1">
                            <li>• Professional driver & clean A.C. cab</li>
                            <li>• Base package / base km as per service</li>
                            <li>• GST included if applicable</li>
                            <li>• Fuel and driver charges</li>
                          </ul>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-red-200">
                          <h5 className="font-semibold text-red-800 mb-2">❌ Exclusions</h5>
                          <ul className="text-sm text-slate-700 space-y-1">
                            <li>• Toll, Parking, Inter-state entry tax</li>
                            <li>• Extra km/hr beyond base limits</li>
                            <li>• Night charges / Driver allowance</li>
                            <li>• Any government taxes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            💰 All prices include GST • 🕒 24/7 customer support • 🚗 Well-maintained cars
          </p>
        </div>
      </div>
    </section>
  );
}