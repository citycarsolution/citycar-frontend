// src/sections/Results.jsx
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
  { id: "sedan",    title: "Sedan — Dzire / Xcent",  seats: "4 + 1", img: "/cars/sedan.png",    description: "AC Col 14 - 1" },
  { id: "ertiga",   title: "SUV — Ertiga / Enjoy",   seats: "5 + 1", img: "/cars/ertiga.jpg",   description: "AC Col 15 - 1" },
  { id: "carens",   title: "SUV — Kia Carens",       seats: "5 + 1", img: "/cars/carens.jpg",   description: "AC Col 15 - 1" },
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
    <section className="w-full min-h-screen flex justify-center bg-slate-100">
      {/* inner mobile container (like phone) */}
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* top bar */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
              {headerLine}
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              {PRICE.airport.note}
            </p>
            {service === "local" && (
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Package:{" "}
                {cityPackKey === "12x120"
                  ? "12 Hours / 120 KM"
                  : "8 Hours / 80 KM"}
              </p>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-xs sm:text-sm px-3 py-2 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 active:scale-[0.98] transition"
          >
            ← Change Search
          </button>
        </div>

        {/* controls */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* distance */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
            <label className="text-[11px] font-medium text-gray-600">
              Estimated distance (km)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={km ?? 0}
              onChange={(e) => setKm(Number(e.target.value) || 0)}
              className="mt-1 w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              placeholder="Approx road km"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {autoKm !== null
                ? "Auto from map • You can edit"
                : "No map coords — type approx km"}
            </p>
          </div>

          {/* arrival */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
            <label className="text-[11px] font-medium text-gray-600">
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
              className="mt-1 w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
            />
            <div className="mt-1 text-[11px] text-gray-700 flex items-center flex-wrap gap-1">
              <span className="inline-flex px-2 py-[2px] rounded-full bg-slate-100">
                ≈ {prettyDuration(estimatedTravelMin)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTouchedDelay(false);
                  setArrivalDelayMin(estimatedTravelMin);
                }}
                className="underline text-rose-600"
              >
                Use this
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Arrival time: {arrivalClock || "—"}
            </p>
          </div>

          {/* notes */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs col-span-2 md:col-span-1">
            <label className="text-[11px] font-medium text-gray-600">
              Notes
            </label>
            <div className="text-[11px] mt-2 text-gray-700 leading-snug">
              {subNote}
            </div>
          </div>
        </div>

        {/* results list */}
        <div className="mt-5 space-y-3 sm:space-y-4">
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
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
              >
                <div className="p-3 sm:p-4 flex items-center gap-3">
                  {/* image */}
                  <div className="flex-shrink-0">
                    <img
                      src={car.img}
                      alt={car.title}
                      className="w-24 h-18 sm:w-28 sm:h-20 object-cover rounded-xl border border-slate-200 bg-slate-50"
                      onError={(e) => handleImageError(e, car.id)}
                    />
                  </div>

                  {/* text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[14px] sm:text-sm text-slate-900 truncate">
                      {car.title}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {car.description} • {car.seats}
                    </p>

                    {service === "airport" && airportCfg && (
                      <p className="text-[11px] sm:text-xs text-gray-700 mt-1">
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
                      <p className="text-[11px] sm:text-xs text-gray-700 mt-1">
                        Includes base hours & kms • Extra km/hr as per car •
                        Package: {packMeta?.packageKey || cityPackKey}
                      </p>
                    )}

                    {service === "outstation" &&
                      searchParams?.tripType === "oneway" && (
                        <p className="text-[11px] sm:text-xs text-gray-700 mt-1">
                          Min billable 100km • Extra as per car
                        </p>
                      )}

                    {service === "outstation" &&
                      searchParams?.tripType === "roundtrip" && (
                        <p className="text-[11px] sm:text-xs text-gray-700 mt-1">
                          Min {PRICE.roundtrip.dailyMinKm}km/day • ₹
                          {PRICE.roundtrip.perKm[car.id]}/km • Driver ₹
                          {premium(car.id)
                            ? PRICE.roundtrip.driverAllowance.premium
                            : PRICE.roundtrip.driverAllowance.default}
                          /day
                        </p>
                      )}

                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : car.id)}
                      className="mt-1.5 text-[11px] sm:text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      View Fare Detail {isOpen ? "▴" : "▾"}
                    </button>
                  </div>

                  {/* right price + green button */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-xl font-bold text-slate-900">
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
                      className="mt-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-[0.97] transition"
                    >
                      Book Now
                    </button>
                    <div className="text-[10px] text-gray-500 mt-1">
                      ETA: {prettyDuration(arrivalDelayMin)}
                    </div>
                  </div>
                </div>

                {/* expandable detail */}
                {isOpen && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 text-[12px] sm:text-sm text-gray-700 border-t bg-slate-50">
                    <div className="py-2 sm:py-3">
                      {service === "airport" && (
                        <>
                          <div>
                            Base ₹{airportCfg.baseFare} for {airportCfg.baseKm}
                            {airportCfg.baseIsHours ? " (4h/40km)" : "km"} •
                            Extra km: {fare.extraKm} × ₹
                            {airportCfg.extraPerKm} = ₹
                            {(
                              fare.distanceFare - airportCfg.baseFare
                            ).toLocaleString("en-IN")}
                          </div>
                          {fare.waitFare > 0 && (
                            <div>
                              Waiting after free {airportCfg.waitFreeMin}
                              {airportCfg.baseIsHours ? "min (4h)" : "min"}: ₹
                              {fare.waitFare.toLocaleString("en-IN")}
                            </div>
                          )}
                          <div className="mt-1">
                            Tolls/Parking extra at actuals.
                          </div>
                        </>
                      )}

                      {service === "outstation" &&
                        searchParams?.tripType === "oneway" && (
                          <>
                            <div>
                              Billable km: {fare.effectiveKm} (min{" "}
                              {PRICE.oneway[car.id].baseKm})
                            </div>
                            {fare.extraKm > 0 && (
                              <div>
                                Extra km: {fare.extraKm} × ₹
                                {PRICE.oneway[car.id].extraPerKm} = ₹
                                {(
                                  fare.extraKm *
                                  PRICE.oneway[car.id].extraPerKm
                                ).toLocaleString("en-IN")}
                              </div>
                            )}
                          </>
                        )}

                      {service === "outstation" &&
                        searchParams?.tripType === "roundtrip" && (
                          <>
                            <div>
                              Days: {fare.days} • Actual km: {km || 0} •
                              Billable km: {fare.billableKm} (min{" "}
                              {PRICE.roundtrip.dailyMinKm}×{fare.days})
                            </div>
                            <div>
                              Kilometer charges: {fare.billableKm} × ₹
                              {fare.perKm} = ₹
                              {fare.kmFare.toLocaleString("en-IN")}
                            </div>
                            <div>
                              Driver allowance: ₹{fare.daPerDay}/day ×{" "}
                              {fare.days} = ₹
                              {fare.daTotal.toLocaleString("en-IN")}
                            </div>
                          </>
                        )}

                      {service === "local" && (
                        <div>
                          Billing from Pick-up to Pick-up • DA after 12am: ₹
                          {PRICE.city.driverAllowanceAfterMidnight}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-slate-200">
                        <div className="font-semibold text-[12px]">
                          Inclusions
                        </div>
                        <ul className="mt-1.5 text-[11px] space-y-1 list-disc list-inside">
                          <li>Professional driver & clean A.C. cab</li>
                          <li>Base package / base km as per service</li>
                          <li>GST included if applicable</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200">
                        <div className="font-semibold text-[12px]">
                          Exclusions
                        </div>
                        <ul className="mt-1.5 text-[11px] space-y-1 list-disc list-inside">
                          <li>Toll, Parking, Inter-state entry tax</li>
                          <li>Extra km/hr beyond base limits</li>
                          <li>
                            Night charges / Driver allowance when applicable
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
