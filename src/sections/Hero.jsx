import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OUTSTATION_CITIES } from "../data/outstationCities";
import { AIRPORTS } from "../data/airportsData";

const PHOTON_URL = "https://photon.komoot.io/api/";

/* ------------ small helpers ------------- */

function debounce(fn, ms = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* India helpers */
const IN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Andaman and Nicobar Islands",
  "Lakshadweep",
];

const isIndiaFeature = (p) => {
  const country = (p?.country || "").toLowerCase();
  const state = (p?.state || "").toLowerCase();
  return (
    country === "india" ||
    IN_STATES.some((s) => s.toLowerCase() === state)
  );
};

function normalizeIndiaLabel(p) {
  const state = p.state || "";
  let city =
    p.city || p.town || p.village || p.suburb || "";

  // mumbai special-case
  if (!city && state === "Maharashtra") {
    const admin = [
      p.city,
      p.town,
      p.village,
      p.county,
      p.district,
      p.state_district,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (/mumbai/.test(admin)) city = "Mumbai";
  }
  if (
    !city &&
    state === "Maharashtra" &&
    /(ward)/i.test(p.district || "")
  ) {
    city = "Mumbai";
  }

  const name =
    p.name || p.street || p.suburb || city || "";
  const parts = [name, city, state, "India"].filter(Boolean);
  return {
    label: parts.join(", "),
    name,
    city,
    state,
    country: "India",
  };
}

async function photonSearch(
  q,
  limit = 8,
  lat = null,
  lon = null,
  signal = null
) {
  if (!q || q.trim().length < 2) return [];
  const cleanQuery = q.replace(/[^\w\s]/gi, "").trim();
  if (cleanQuery.length < 2) return [];

  const query = `${cleanQuery} India`;
  const urlBase = `${PHOTON_URL}?q=${encodeURIComponent(
    query
  )}&limit=${limit}&lang=en`;
  const url =
    lat && lon
      ? `${urlBase}&lat=${lat}&lon=${lon}`
      : urlBase;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const json = await res.json();

    return (json.features || [])
      .filter((f) => isIndiaFeature(f.properties))
      .map((f) => {
        const p = f.properties || {};
        const g = f.geometry || {};
        const n = normalizeIndiaLabel(p);
        const [lon0, lat0] = g.coordinates || [];
        return {
          id: `${p.osm_id || Math.random()}`,
          label: n.label,
          name: n.name,
          city: n.city,
          state: n.state,
          country: n.country,
          lat: typeof lat0 === "number" ? lat0 : null,
          lon: typeof lon0 === "number" ? lon0 : null,
          type: p.type || p.category || "location",
        };
      });
  } catch {
    return [];
  }
}

/* curated local samples */
const INDIAN_LOCATIONS = [
  "Colaba, Mumbai, Maharashtra, India",
  "Bandra West, Mumbai, Maharashtra, India",
  "Andheri East, Mumbai, Maharashtra, India",
  "Vashi, Navi Mumbai, Maharashtra, India",
  "Nerul, Navi Mumbai, Maharashtra, India",
  "Connaught Place, Delhi, India",
  "Koramangala, Bangalore, Karnataka, India",
];

const getPlaceIcon = (place = "") => {
  const s = place.toLowerCase();
  if (s.includes("airport")) return "✈";
  if (s.includes("station") || s.includes("terminus"))
    return "🚉";
  if (s.includes("hotel")) return "🏨";
  if (s.includes("hospital")) return "🏥";
  if (
    s.includes("college") ||
    s.includes("university")
  )
    return "🎓";
  if (s.includes("school")) return "🏫";
  if (s.includes("mall") || s.includes("market"))
    return "🛍";
  if (s.includes("park")) return "🌳";
  if (s.includes("beach")) return "🏖";
  if (s.includes("temple") || s.includes("mandir"))
    return "🛕";
  if (s.includes("complex") || s.includes("bkc"))
    return "🏢";
  if (
    s.includes("apartment") ||
    s.includes("society")
  )
    return "🏠";
  return "📍";
};

/* ================= HERO COMPONENT ================= */

export default function Hero({ onSearch = () => {} }) {
  const [service, setService] = useState("local");
  const [airportMode, setAirportMode] =
    useState("drop");
  const [tripType, setTripType] =
    useState("oneway");
  const [videoReady, setVideoReady] =
    useState(false);

  const todayISO = new Date()
    .toISOString()
    .split("T")[0];
  const defaultTime = new Date(
    Date.now() + 3600000
  )
    .toTimeString()
    .slice(0, 5);

  // form state
  const [localPickup, setLocalPickup] =
    useState("");
  const [selectedLocalPlace, setSelectedLocalPlace] =
    useState(null);
  const [fromVal, setFromVal] = useState("");
  const [toVal, setToVal] = useState("");
  const [selectedFromPlace, setSelectedFromPlace] =
    useState(null);
  const [selectedToPlace, setSelectedToPlace] =
    useState(null);
  const [airportText, setAirportText] =
    useState("");
  const [selectedAirportItem, setSelectedAirportItem] =
    useState(null);

  const [localPackage, setLocalPackage] =
    useState("8x80");

  const [localDate, setLocalDate] =
    useState(todayISO);
  const [localTime, setLocalTime] =
    useState(defaultTime);
  const [outPickupDate, setOutPickupDate] =
    useState(todayISO);
  const [outPickupTime, setOutPickupTime] =
    useState(defaultTime);
  const [outReturnDate, setOutReturnDate] =
    useState(todayISO);
  const [outReturnTime, setOutReturnTime] =
    useState(defaultTime);
  const [airportDate, setAirportDate] =
    useState(todayISO);
  const [airportTime, setAirportTime] =
    useState(defaultTime);

  // suggestions
  const [pickupSug, setPickupSug] = useState([]);
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);
  const [airportSug, setAirportSug] =
    useState([]);

  const [pickupOpen, setPickupOpen] =
    useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [airportOpen, setAirportOpen] =
    useState(false);

  // refs for xhr + dropdown
  const pickupController = useRef(null);
  const toController = useRef(null);
  const pickupListRef = useRef(null);
  const fromListRef = useRef(null);
  const toListRef = useRef(null);
  const airportListRef = useRef(null);
  const pickupInputRef = useRef(null);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const airportInputRef = useRef(null);

  const lastPickedRef = useRef({
    pickup: null,
    to: null,
    airport: null,
    from: null,
  });

  const minReturnDate = useMemo(() => {
    if (tripType === "roundtrip" && outPickupDate) {
      const nextDay = new Date(outPickupDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString().split("T")[0];
    }
    return todayISO;
  }, [outPickupDate, tripType, todayISO]);

  /* ------------------- fetchers ------------------- */

  const fetchUniversalLocation = useMemo(
    () =>
      debounce(async (q, serviceType) => {
        if (!q || q.trim().length < 2) {
          setPickupSug([]);
          setPickupOpen(false);
          return;
        }
        const qq = q.toLowerCase().trim();

        if (
          lastPickedRef.current.pickup &&
          qq ===
            lastPickedRef.current.pickup.toLowerCase()
        ) {
          return;
        }

        let combined = [];
        try {
          if (pickupController.current)
            pickupController.current.abort();
          pickupController.current =
            new AbortController();
          const photon = await photonSearch(
            q,
            12,
            null,
            null,
            pickupController.current.signal
          );
          const photonFormatted = photon.map(
            (place, idx) => ({
              ...place,
              id: `photon_${idx}_${place.id}`,
              icon: getPlaceIcon(place.label),
              service: serviceType,
            })
          );
          const localMatches = INDIAN_LOCATIONS.filter(
            (place) =>
              place.toLowerCase().includes(qq)
          )
            .slice(0, 6)
            .map((place, index) => {
              const parts = place.split(",");
              return {
                id: `local_${index}_${place}`,
                label: place,
                name: parts[0],
                city: parts[1]?.trim() || "",
                state: parts[2]?.trim() || "",
                type: "location",
                icon: getPlaceIcon(place),
                service: serviceType,
                lat: null,
                lon: null,
              };
            });

          combined = [...photonFormatted, ...localMatches];
          const seen = new Set();
          combined = combined.filter((it) => {
            const key = (it.label || "").toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        } catch {
          // ignore
        }

        setPickupSug(combined.slice(0, 20));
        setPickupOpen(combined.length > 0);
      }, 400),
    []
  );

  const fetchDropLocation = useMemo(
    () =>
      debounce(async (q) => {
        if (!q || q.trim().length < 2) {
          setToSug([]);
          setToOpen(false);
          return;
        }
        const qq = q.toLowerCase().trim();

        if (
          lastPickedRef.current.to &&
          qq ===
            lastPickedRef.current.to.toLowerCase()
        ) {
          return;
        }

        let combined = [];
        try {
          if (toController.current)
            toController.current.abort();
          toController.current = new AbortController();
          const photon = await photonSearch(
            q,
            12,
            null,
            null,
            toController.current.signal
          );
          const photonFormatted = photon.map(
            (place, idx) => ({
              ...place,
              id: `photon_drop_${idx}_${place.id}`,
              icon: getPlaceIcon(place.label),
              service: "airport",
            })
          );
          const localMatches = INDIAN_LOCATIONS.filter(
            (place) =>
              place.toLowerCase().includes(qq)
          )
            .slice(0, 6)
            .map((place, index) => {
              const parts = place.split(",");
              return {
                id: `drop_${index}_${place}`,
                label: place,
                name: parts[0],
                city: parts[1]?.trim() || "",
                state: parts[2]?.trim() || "",
                type: "location",
                icon: getPlaceIcon(place),
                service: "airport",
                lat: null,
                lon: null,
              };
            });

          combined = [...photonFormatted, ...localMatches];
          const seen = new Set();
          combined = combined.filter((it) => {
            const key = (it.label || "").toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        } catch {
          // ignore
        }

        setToSug(combined.slice(0, 20));
        setToOpen(combined.length > 0);
      }, 400),
    []
  );

  const fetchOutstationFrom = useMemo(
    () =>
      debounce((q) => {
        if (!q || q.trim().length < 2) {
          setFromSug([]);
          setFromOpen(false);
          return;
        }
        const qq = q.toLowerCase();

        if (
          lastPickedRef.current.from &&
          qq ===
            lastPickedRef.current.from.toLowerCase()
        ) {
          return;
        }

        const cityMatches = (OUTSTATION_CITIES || [])
          .filter((c) => c.toLowerCase().includes(qq))
          .slice(0, 12)
          .map((c) => ({
            id: c,
            label: c,
            type: "city",
            icon: "🏙",
          }));
        setFromSug(cityMatches);
        setFromOpen(cityMatches.length > 0);
      }, 300),
    []
  );

  const fetchAirportSuggestions = useMemo(
    () =>
      debounce((q) => {
        if (!q || q.trim().length < 2) {
          setAirportSug([]);
          setAirportOpen(false);
          return;
        }
        const qq = q.toLowerCase();

        if (
          lastPickedRef.current.airport &&
          qq ===
            lastPickedRef.current.airport.toLowerCase()
        ) {
          return;
        }

        const matches = (AIRPORTS || [])
          .filter(
            (a) =>
              a.label?.toLowerCase()?.includes(qq) ||
              a.id?.toLowerCase?.()?.includes(qq)
          )
          .slice(0, 30)
          .map((airport) => ({
            ...airport,
            icon: "✈",
          }));

        setAirportSug(matches);
        setAirportOpen(matches.length > 0);
      }, 300),
    []
  );

  /* ------------------- effects ------------------- */

  useEffect(() => {
    if (service === "local") {
      fetchUniversalLocation(localPickup, "local");
    } else if (
      service === "airport" &&
      airportMode === "drop"
    ) {
      fetchUniversalLocation(localPickup, "airport");
    } else {
      setPickupSug([]);
      setPickupOpen(false);
    }
  }, [
    localPickup,
    service,
    airportMode,
    fetchUniversalLocation,
  ]);

  useEffect(() => {
    if (service === "outstation") {
      fetchOutstationFrom(fromVal);
    }
  }, [fromVal, service, fetchOutstationFrom]);

  useEffect(() => {
    if (service === "outstation") {
      if (!toVal || toVal.trim().length < 2) {
        setToSug([]);
        setToOpen(false);
        return;
      }
      const qq = toVal.toLowerCase();

      if (
        lastPickedRef.current.to &&
        qq ===
          lastPickedRef.current.to.toLowerCase()
      ) {
        return;
      }

      const cityMatches = (OUTSTATION_CITIES || [])
        .filter((c) => c.toLowerCase().includes(qq))
        .slice(0, 12)
        .map((c) => ({
          id: c,
          label: c,
          type: "city",
          icon: "🏙",
        }));

      setToSug(cityMatches);
      setToOpen(cityMatches.length > 0);
    } else if (
      service === "airport" &&
      airportMode === "pickup"
    ) {
      fetchDropLocation(toVal);
    } else {
      setToSug([]);
      setToOpen(false);
    }
  }, [
    toVal,
    service,
    airportMode,
    fetchDropLocation,
  ]);

  useEffect(() => {
    if (service === "airport") {
      fetchAirportSuggestions(airportText);
    } else {
      setAirportSug([]);
      setAirportOpen(false);
    }
  }, [
    airportText,
    service,
    fetchAirportSuggestions,
  ]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        pickupListRef.current &&
        !pickupListRef.current.contains(e.target)
      )
        setPickupOpen(false);
      if (
        fromListRef.current &&
        !fromListRef.current.contains(e.target)
      )
        setFromOpen(false);
      if (
        toListRef.current &&
        !toListRef.current.contains(e.target)
      )
        setToOpen(false);
      if (
        airportListRef.current &&
        !airportListRef.current.contains(e.target)
      )
        setAirportOpen(false);
    }
    document.addEventListener(
      "mousedown",
      handleClickOutside
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  async function enrichIfNoCoords(item) {
    if (!item) return item;
    if (
      typeof item.lat === "number" &&
      typeof item.lon === "number"
    )
      return item;
    const q = item?.label || item?.name || "";
    if (!q) return item;
    try {
      const best = (await photonSearch(q, 1))?.[0];
      if (best)
        return {
          ...item,
          lat: best.lat,
          lon: best.lon,
        };
    } catch {
      // ignore
    }
    return item;
  }

  /* ---------- pick helpers ---------- */

  const pickLocal = async (item) => {
    const x = await enrichIfNoCoords(item);
    setLocalPickup(x.label);
    setSelectedLocalPlace(x);
    setPickupSug([]);
    setPickupOpen(false);
    lastPickedRef.current.pickup = x.label;
    setTimeout(() => {
      if (
        lastPickedRef.current.pickup === x.label
      )
        lastPickedRef.current.pickup = null;
    }, 700);
    pickupInputRef.current?.blur();
  };

  const pickFrom = async (item) => {
    const x = await enrichIfNoCoords(item);
    setFromVal(x.label);
    setSelectedFromPlace(x);
    setFromSug([]);
    setFromOpen(false);
    lastPickedRef.current.from = x.label;
    setTimeout(() => {
      if (
        lastPickedRef.current.from === x.label
      )
        lastPickedRef.current.from = null;
    }, 700);
    fromInputRef.current?.blur();
  };

  const pickTo = async (item) => {
    const x = await enrichIfNoCoords(item);
    setToVal(x.label);
    setSelectedToPlace(x);
    setToSug([]);
    setToOpen(false);
    lastPickedRef.current.to = x.label;
    setTimeout(() => {
      if (
        lastPickedRef.current.to === x.label
      )
        lastPickedRef.current.to = null;
    }, 700);
    toInputRef.current?.blur();
  };

  const pickAirport = async (item) => {
    const x = await enrichIfNoCoords(item);
    setAirportText(x.label);
    setSelectedAirportItem(x);
    setAirportSug([]);
    setAirportOpen(false);
    lastPickedRef.current.airport = x.label;
    setTimeout(() => {
      if (
        lastPickedRef.current.airport === x.label
      )
        lastPickedRef.current.airport = null;
    }, 700);
    airportInputRef.current?.blur();
  };

  /* ---------- handlers ---------- */

  const handleServiceChange = (newService) => {
    setService(newService);
    setLocalPickup("");
    setFromVal("");
    setToVal("");
    setAirportText("");
    setSelectedLocalPlace(null);
    setSelectedFromPlace(null);
    setSelectedToPlace(null);
    setSelectedAirportItem(null);
    setPickupSug([]);
    setFromSug([]);
    setToSug([]);
    setAirportSug([]);
    setTripType("oneway");
  };

  const handleTripTypeChange = (type) => {
    setTripType(type);
    if (type === "oneway") {
      setOutReturnDate(todayISO);
      setOutReturnTime(defaultTime);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    let payload = null;

    if (service === "local") {
      if (!localPickup.trim()) {
        alert("Please enter pickup location");
        return;
      }
      const pkgHours =
        localPackage === "12x120"
          ? 12
          : localPackage === "8x80"
          ? 8
          : 24;
      const pkgKm =
        localPackage === "12x120"
          ? 120
          : localPackage === "8x80"
          ? 80
          : 250;

      payload = {
        service: "local",
        pickup:
          selectedLocalPlace || {
            label: localPickup,
          },
        pickupDate: localDate,
        pickupTime: localTime,
        package: localPackage,
        packageId: localPackage,
        packageHours: pkgHours,
        packageKm: pkgKm,
      };
    } else if (service === "outstation") {
      if (!fromVal.trim() || !toVal.trim()) {
        alert(
          "Please enter both from and to locations"
        );
        return;
      }
      payload = {
        service: "outstation",
        tripType,
        pickup:
          selectedFromPlace || {
            label: fromVal,
          },
        drop:
          selectedToPlace || { label: toVal },
        pickupDate: outPickupDate,
        pickupTime: outPickupTime,
        ...(tripType === "roundtrip" && {
          returnDate: outReturnDate,
          returnTime: outReturnTime,
        }),
      };
    } else if (service === "airport") {
      if (airportMode === "drop") {
        if (
          !localPickup.trim() ||
          !airportText.trim()
        ) {
          alert(
            "Please enter both pickup location and airport"
          );
          return;
        }
        payload = {
          service: "airport",
          airportMode: "drop",
          pickup:
            selectedLocalPlace || {
              label: localPickup,
            },
          airport:
            selectedAirportItem || {
              label: airportText,
            },
          pickupDate: airportDate,
          pickupTime: airportTime,
        };
      } else {
        if (
          !airportText.trim() ||
          !toVal.trim()
        ) {
          alert(
            "Please enter both airport and drop location"
          );
          return;
        }
        payload = {
          service: "airport",
          airportMode: "pickup",
          airport:
            selectedAirportItem || {
              label: airportText,
            },
          drop:
            selectedToPlace || { label: toVal },
          pickupDate: airportDate,
          pickupTime: airportTime,
        };
      }
    }

    if (payload) {
      try {
        console.log("SEARCH_PAYLOAD:", payload);
      } catch {}
      onSearch(payload);
    }
  };

  /* ================= UI ================= */

  return (
    <section className="relative w-full min-h-[420px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
      {/* background video */}
      <video
        className={`absolute inset-0 h-full w-full object-cover z-0 pointer-events-none transition-opacity duration-500 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        aria-hidden="true"
      >
        <source
          src="/bg-video.mp4"
          type="video/mp4"
        />
      </video>

      {/* dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85 z-10 pointer-events-none" />

      {/* content */}
      <div className="relative z-20 w-full px-3 md:px-6 lg:px-10 py-10 md:py-16">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] px-4 py-5 md:px-8 md:py-8 text-white">
          {/* tabs row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("local")
                }
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                  service === "local"
                    ? "bg-white text-slate-900 border-white shadow-lg"
                    : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                }`}
              >
                Local Rentals
              </button>
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("outstation")
                }
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                  service === "outstation"
                    ? "bg-white text-slate-900 border-white shadow-lg"
                    : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                }`}
              >
                Outstation
              </button>
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("airport")
                }
                className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                  service === "airport"
                    ? "bg-white text-slate-900 border-white shadow-lg"
                    : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                }`}
              >
                Airport Transfer
              </button>
            </div>

            {/* right side toggles */}
            <div className="ml-auto flex flex-wrap gap-2 text-xs md:text-sm">
              {service === "outstation" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      handleTripTypeChange("oneway")
                    }
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      tripType === "oneway"
                        ? "bg-sky-500 text-white border-sky-400"
                        : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    🚗 One Way
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTripTypeChange(
                        "roundtrip"
                      )
                    }
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      tripType === "roundtrip"
                        ? "bg-sky-500 text-white border-sky-400"
                        : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    🔄 Round Trip
                  </button>
                </>
              )}

              {service === "airport" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAirportMode("drop");
                      setSelectedAirportItem(null);
                      setAirportText("");
                      setToVal("");
                      setSelectedToPlace(null);
                    }}
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      airportMode === "drop"
                        ? "bg-sky-500 text-white border-sky-400"
                        : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    🚗 Drop to Airport
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAirportMode("pickup");
                      setSelectedAirportItem(null);
                      setAirportText("");
                      setLocalPickup("");
                      setSelectedLocalPlace(null);
                    }}
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      airportMode === "pickup"
                        ? "bg-sky-500 text-white border-sky-400"
                        : "bg-slate-800/60 text-white/80 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    🛬 Pickup from Airport
                  </button>
                </>
              )}
            </div>
          </div>

          {/* sub heading */}
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {service === "local"
              ? "Local Rentals"
              : service === "outstation"
              ? "Outstation Trip"
              : "Airport Transfer"}
          </h2>

          {/* ------------- FORM ------------- */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* LOCAL */}
            {service === "local" && (
              <>
                <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] items-end">
                  {/* pickup */}
                  <div
                    className="relative"
                    ref={pickupListRef}
                  >
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Pickup Location (India)
                    </label>
                    <input
                      ref={pickupInputRef}
                      type="text"
                      value={localPickup}
                      onChange={(e) => {
                        setSelectedLocalPlace(null);
                        setLocalPickup(
                          e.target.value
                        );
                      }}
                      placeholder="City, locality, hotel, office..."
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                    {pickupOpen &&
                      pickupSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                          {pickupSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickLocal(sug);
                              }}
                              className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-xl flex-shrink-0">
                                {getPlaceIcon(
                                  sug.label
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-800 font-medium truncate">
                                  {sug.name ||
                                    sug.label}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {sug.city && (
                                    <span>
                                      {sug.city}
                                    </span>
                                  )}
                                  {sug.state && (
                                    <span>
                                      {sug.city
                                        ? ", "
                                        : ""}
                                      {sug.state}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* package */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Package
                    </label>
                    <select
                      value={localPackage}
                      onChange={(e) =>
                        setLocalPackage(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    >
                      <option value="8x80">
                        8 Hours / 80 Km
                      </option>
                      <option value="12x120">
                        12 Hours / 120 Km
                      </option>
                      <option value="full">
                        Full Day / 250 Km
                      </option>
                    </select>
                  </div>

                  {/* date */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={localDate}
                      min={todayISO}
                      onChange={(e) =>
                        setLocalDate(e.target.value)
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>

                  {/* time */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={localTime}
                      onChange={(e) =>
                        setLocalTime(e.target.value)
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* OUTSTATION */}
            {service === "outstation" && (
              <>
                <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] items-end">
                  {/* from */}
                  <div
                    className="relative"
                    ref={fromListRef}
                  >
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      From City (India)
                    </label>
                    <input
                      ref={fromInputRef}
                      type="text"
                      value={fromVal}
                      onChange={(e) => {
                        setSelectedFromPlace(null);
                        setFromVal(e.target.value);
                      }}
                      placeholder="Source city"
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                    {fromOpen &&
                      fromSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                          {fromSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickFrom(sug);
                              }}
                              className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-xl">
                                🏙
                              </span>
                              <div className="text-gray-800 font-medium">
                                {sug.label}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* to */}
                  <div
                    className="relative"
                    ref={toListRef}
                  >
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      To City (India)
                    </label>
                    <input
                      ref={toInputRef}
                      type="text"
                      value={toVal}
                      onChange={(e) => {
                        setSelectedToPlace(null);
                        setToVal(e.target.value);
                      }}
                      placeholder="Destination city"
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                    {toOpen &&
                      toSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                          {toSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickTo(sug);
                              }}
                              className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-xl">
                                🏙
                              </span>
                              <div className="text-gray-800 font-medium">
                                {sug.label}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                  {/* date */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      {tripType === "oneway"
                        ? "Pickup Date"
                        : "Departure Date"}
                    </label>
                    <input
                      type="date"
                      value={outPickupDate}
                      min={todayISO}
                      onChange={(e) =>
                        setOutPickupDate(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>

                  {/* time */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      {tripType === "oneway"
                        ? "Pickup Time"
                        : "Departure Time"}
                    </label>
                    <input
                      type="time"
                      value={outPickupTime}
                      onChange={(e) =>
                        setOutPickupTime(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>
                </div>

                {tripType === "roundtrip" && (
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)] max-w-md mt-2">
                    <div>
                      <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                        Return Date
                      </label>
                      <input
                        type="date"
                        value={outReturnDate}
                        min={minReturnDate}
                        onChange={(e) =>
                          setOutReturnDate(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                        Return Time
                      </label>
                      <input
                        type="time"
                        value={outReturnTime}
                        onChange={(e) =>
                          setOutReturnTime(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* AIRPORT */}
            {service === "airport" && (
              <>
                <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] items-end">
                  {airportMode === "drop" ? (
                    <>
                      {/* pickup location */}
                      <div
                        className="relative"
                        ref={pickupListRef}
                      >
                        <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                          Pickup Location (India)
                        </label>
                        <input
                          ref={pickupInputRef}
                          type="text"
                          value={localPickup}
                          onChange={(e) => {
                            setSelectedLocalPlace(
                              null
                            );
                            setLocalPickup(
                              e.target.value
                            );
                          }}
                          placeholder="Home / Hotel / Office..."
                          className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                        />
                        {pickupOpen &&
                          pickupSug.length >
                            0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                              {pickupSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(
                                      e
                                    ) => {
                                      e.preventDefault();
                                      pickLocal(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-xl flex-shrink-0">
                                      {getPlaceIcon(
                                        sug.label
                                      )}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-gray-800 font-medium truncate">
                                        {sug.name ||
                                          sug.label}
                                      </div>
                                      <div className="text-[11px] text-gray-500 truncate">
                                        {sug.city && (
                                          <span>
                                            {
                                              sug.city
                                            }
                                          </span>
                                        )}
                                        {sug.state && (
                                          <span>
                                            {sug.city
                                              ? ", "
                                              : ""}
                                            {
                                              sug.state
                                            }
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                      </div>

                      {/* airport */}
                      <div
                        className="relative"
                        ref={airportListRef}
                      >
                        <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                          Drop Airport
                        </label>
                        <input
                          ref={airportInputRef}
                          type="text"
                          value={airportText}
                          onChange={(e) => {
                            setSelectedAirportItem(
                              null
                            );
                            setAirportText(
                              e.target.value
                            );
                          }}
                          placeholder="Enter airport name or code"
                          className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                        />
                        {airportOpen &&
                          airportSug.length >
                            0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                              {airportSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(
                                      e
                                    ) => {
                                      e.preventDefault();
                                      pickAirport(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-xl">
                                      ✈
                                    </span>
                                    <div className="text-gray-800 font-medium truncate">
                                      {sug.label}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* pickup airport */}
                      <div
                        className="relative"
                        ref={airportListRef}
                      >
                        <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                          Pickup Airport
                        </label>
                        <input
                          ref={airportInputRef}
                          type="text"
                          value={airportText}
                          onChange={(e) => {
                            setSelectedAirportItem(
                              null
                            );
                            setAirportText(
                              e.target.value
                            );
                          }}
                          placeholder="Enter airport name or code"
                          className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                        />
                        {airportOpen &&
                          airportSug.length >
                            0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                              {airportSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(
                                      e
                                    ) => {
                                      e.preventDefault();
                                      pickAirport(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-xl">
                                      ✈
                                    </span>
                                    <div className="text-gray-800 font-medium truncate">
                                      {sug.label}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                      </div>

                      {/* drop location */}
                      <div
                        className="relative"
                        ref={toListRef}
                      >
                        <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                          Drop Location (India)
                        </label>
                        <input
                          ref={toInputRef}
                          type="text"
                          value={toVal}
                          onChange={(e) => {
                            setSelectedToPlace(null);
                            setToVal(e.target.value);
                          }}
                          placeholder="Home / Hotel / Office..."
                          className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                        />
                        {toOpen &&
                          toSug.length > 0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-sm">
                              {toSug.map((sug) => (
                                <li
                                  key={sug.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    pickTo(sug);
                                  }}
                                  className="cursor-pointer px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                >
                                  <span className="text-xl flex-shrink-0">
                                    {getPlaceIcon(
                                      sug.label
                                    )}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-gray-800 font-medium truncate">
                                      {sug.name ||
                                        sug.label}
                                    </div>
                                    <div className="text-[11px] text-gray-500 truncate">
                                      {sug.city && (
                                        <span>
                                          {
                                            sug.city
                                          }
                                        </span>
                                      )}
                                      {sug.state && (
                                        <span>
                                          {sug.city
                                            ? ", "
                                            : ""}
                                          {
                                            sug.state
                                          }
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>
                    </>
                  )}

                  {/* date */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={airportDate}
                      min={todayISO}
                      onChange={(e) =>
                        setAirportDate(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>

                  {/* time */}
                  <div>
                    <label className="block text-xs md:text-sm text-white/80 mb-1.5">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={airportTime}
                      onChange={(e) =>
                        setAirportTime(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl bg-white text-sm text-slate-900 px-3 py-3 border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* SEARCH BUTTON */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full md:w-48 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-[0_16px_35px_rgba(244,63,94,0.65)] hover:from-pink-600 hover:to-rose-600 transition-all active:scale-[0.97]"
              >
                SEARCH
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
