// src/sections/Results.jsx
import React, { useEffect, useMemo, useState } from "react";

const PRICE = {
  airport: {
    sedan: { baseKm: 10, baseFare: 750, extraPerKm: 15, waitFreeMin: 60, waitPerMin: 2.5 },
    ertiga: { baseKm: 10, baseFare: 950, extraPerKm: 18, waitFreeMin: 60, waitPerMin: 3 },
    carens: { baseKm: 10, baseFare: 1050, extraPerKm: 20, waitFreeMin: 60, waitPerMin: 3 },
    crysta: { baseKm: 40, baseFare: 2250, extraPerKm: 25, waitFreeMin: 240, waitPerMin: 5, baseIsHours: true },
    note: "Billing from Pick-up to Pick-up. Toll & parking extra.",
  },
  city: {
    "8x80": {
      sedan: { baseKm: 80, baseHr: 8, baseFare: 2200, extraPerKm: 13, extraPerHr: 130 },
      ertiga: { baseKm: 80, baseHr: 8, baseFare: 2700, extraPerKm: 17, extraPerHr: 170 },
      carens: { baseKm: 80, baseHr: 8, baseFare: 3000, extraPerKm: 18, extraPerHr: 180 },
      crysta: { baseKm: 80, baseHr: 8, baseFare: 3500, extraPerKm: 22, extraPerHr: 220 },
      hycross: { baseKm: 80, baseHr: 8, baseFare: 4000, extraPerKm: 30, extraPerHr: 300 },
      fortuner: { baseKm: 80, baseHr: 8, baseFare: 6500, extraPerKm: 35, extraPerHr: 350, g2g: true },
    },
    "12x120": {
      sedan: { baseKm: 120, baseHr: 12, baseFare: 3200, extraPerKm: 13, extraPerHr: 130 },
      ertiga: { baseKm: 120, baseHr: 12, baseFare: 4000, extraPerKm: 17, extraPerHr: 170 },
      carens: { baseKm: 120, baseHr: 12, baseFare: 4400, extraPerKm: 18, extraPerHr: 180 },
      crysta: { baseKm: 120, baseHr: 12, baseFare: 5200, extraPerKm: 22, extraPerHr: 220 },
      hycross: { baseKm: 120, baseHr: 12, baseFare: 6400, extraPerKm: 30, extraPerHr: 300 },
      fortuner: { baseKm: 120, baseHr: 12, baseFare: 9300, extraPerKm: 35, extraPerHr: 350, g2g: true },
    },
    driverAllowanceAfterMidnight: 300,
  },
  oneway: {
    sedan: { baseKm: 100, baseFare: 2000, extraPerKm: 15 },
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

const CARS = [
  { id: "sedan", title: "Sedan — Dzire / Xcent", seats: "4 + 1", img: "/cars/sedan.png", description: "AC Col 14 - 1" },
  { id: "ertiga", title: "SUV — Ertiga / Enjoy", seats: "5 + 1", img: "/cars/ertiga.jpg", description: "AC Col 15 - 1" },
  { id: "carens", title: "SUV — Kia Carens", seats: "5 + 1", img: "/cars/carens.jpg", description: "AC Col 15 - 1" },
  { id: "crysta", title: "SUV — Innova Crysta", seats: "5 + 1", img: "/cars/crysta.jpg", description: "Premium SUV" },
  { id: "hycross", title: "SUV — Innova Hycross", seats: "5 + 1", img: "/cars/hycross.jpg", description: "Premium SUV" },
  { id: "fortuner", title: "SUV — Fortuner", seats: "5 + 1", img: "/cars/Fortuner.jpg", description: "Luxury SUV" },
];

const premium = (id) => id === "crysta" || id === "hycross" || id === "fortuner";
const toFixedMoney = (n) => n.toLocaleString("en-IN");

/* helpers */
function haversineKm(a, b) {
  if (!a?.lat || !a?.lon || !b?.lat || !b?.lon) return null;
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * d2r;
  const dLon = (b.lon - a.lon) * d2r;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * d2r) * Math.cos(b.lat * d2r) * Math.sin(dLon / 2) ** 2;
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

  /* pricing */
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
      return `Min billable ${PRICE.oneway.sedan.baseKm}km/day • Sedan extra ₹15/km (SUVs higher)`;
    if (service === "local")
      return `Billing from Pick-up to Pick-up • DA after midnight ₹${PRICE.city.driverAllowanceAfterMidnight}`;
    return "";
  }, [service, searchParams, cityPackKey]);

  const [openId, setOpenId] = useState(null);
  const handleImageError = (e, carId) => {
    e.target.src = FALLBACK_IMAGES[carId];
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 py-4 px-2">
      {/* FIXED: Mobile first design - no max-width constraints */}
      <section className="w-full bg-white rounded-2xl shadow-lg px-4 py-4 mx-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 break-words">
              {searchParams?.pickup?.label || "Location"} · {cityPackKey === "12x120" ? "12H/120KM" : "8H/80KM"}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Billing from Pick-up to Pick-up. Toll & parking extra.
            </p>
            <p className="text-xs text-green-600 mt-1">
              Package: {cityPackKey === "12x120" ? "12 Hours / 120 KM" : "8 Hours / 80 KM"}
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-xs px-3 py-2 rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition flex-shrink-0"
          >
            Change Search
          </button>
        </div>

        {/* Controls - Simple layout */}
        <div className="space-y-3 mb-6">
          {/* Distance */}
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Estimated distance (km)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={km ?? 0}
              onChange={(e) => setKm(Number(e.target.value) || 0)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter km"
            />
            <p className="text-xs text-gray-500 mt-1">
              {autoKm !== null ? "Auto calculated • Edit if needed" : "Enter approximate distance"}
            </p>
          </div>

          {/* Arrival Delay */}
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <label className="text-sm font-medium text-gray-700 block mb-2">
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
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                ≈ {prettyDuration(estimatedTravelMin)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTouchedDelay(false);
                  setArrivalDelayMin(estimatedTravelMin);
                }}
                className="text-xs text-blue-600 underline"
              >
                Use estimated time
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Arrival time: {arrivalClock || "—"}
            </p>
          </div>

          {/* Notes */}
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Important Notes
            </label>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Billing from Pick-up to Pick-up</p>
              <p>• Driver allowance after midnight: ₹300</p>
              <p>• Toll and parking charges extra</p>
            </div>
          </div>
        </div>

        {/* Cars List - Simple cards */}
        <div className="space-y-4">
          {CARS.map((car) => {
            const fare = fareFor(car.id);
            if (!fare) return null;

            return (
              <div
                key={car.id}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={car.img}
                    alt={car.title}
                    className="w-20 h-16 object-cover rounded-lg border border-gray-200"
                    onError={(e) => handleImageError(e, car.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {car.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {car.description} • {car.seats}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Includes base hours & kms • Extra km/hr as per car
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === car.id ? null : car.id)}
                      className="text-xs text-blue-600 mt-2"
                    >
                      {openId === car.id ? "Hide Details" : "View Fare Details"}
                    </button>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-gray-900">
                      ₹ {toFixedMoney(Math.round(fare.total ?? 0))}
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
                        };
                        onSelect?.(payload);
                      }}
                      className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      Book Now
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      ETA: {prettyDuration(arrivalDelayMin)}
                    </div>
                  </div>
                </div>

                {openId === car.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 space-y-2">
                      <p><strong>Package:</strong> {cityPackKey}</p>
                      <p><strong>Base fare includes:</strong> {cityPackKey === "12x120" ? "12 hours / 120 km" : "8 hours / 80 km"}</p>
                      <p><strong>Extra charges:</strong> Beyond package limits</p>
                      <p><strong>Driver allowance:</strong> ₹300 after midnight</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}