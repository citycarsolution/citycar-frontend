// src/sections/Hero.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { OUTSTATION_CITIES } from "../data/outstationCities";
import { AIRPORTS } from "../data/airportsData";

const PHOTON_URL = "https://photon.komoot.io/api/";

/* ------------- helpers ------------- */

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

  // special case Mumbai
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
  const parts = [name, city, state, "India"].filter(
    Boolean
  );
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
  } catch (e) {
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

/* ------------- COMPONENT ------------- */

export default function Hero({ onSearch = () => {} }) {
  /* basic state */
  const [service, setService] = useState("local"); // local | outstation | airport
  const [airportMode, setAirportMode] =
    useState("drop"); // drop | pickup
  const [tripType, setTripType] =
    useState("oneway"); // oneway | roundtrip
  const [videoReady, setVideoReady] = useState(false);

  // current date + next hour time
  const todayISO = new Date()
    .toISOString()
    .split("T")[0];
  const defaultTime = new Date(
    Date.now() + 60 * 60 * 1000
  )
    .toTimeString()
    .slice(0, 5);

  /* form state */
  const [localPickup, setLocalPickup] = useState("");
  const [selectedLocalPlace, setSelectedLocalPlace] =
    useState(null);

  const [fromVal, setFromVal] = useState("");
  const [toVal, setToVal] = useState("");
  const [selectedFromPlace, setSelectedFromPlace] =
    useState(null);
  const [selectedToPlace, setSelectedToPlace] =
    useState(null);

  const [airportText, setAirportText] = useState("");
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

  /* suggestions */
  const [pickupSug, setPickupSug] = useState([]);
  const [fromSug, setFromSug] = useState([]);
  const [toSug, setToSug] = useState([]);
  const [airportSug, setAirportSug] = useState([]);

  const [pickupOpen, setPickupOpen] = useState(false);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [airportOpen, setAirportOpen] =
    useState(false);

  /* refs */
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

  // to avoid suggestions opening again immediately
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

  /* ------------- fetchers ------------- */

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

          const localMatches = INDIAN_LOCATIONS
            .filter((place) =>
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
        } catch (e) {
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
          qq === lastPickedRef.current.to.toLowerCase()
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

          const localMatches = INDIAN_LOCATIONS
            .filter((place) =>
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
        } catch (e) {
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

  /* ------------- Effects ------------- */

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
        qq === lastPickedRef.current.to.toLowerCase()
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

  /* ------------- pick helpers ------------- */

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
      if (best) {
        return {
          ...item,
          lat: best.lat,
          lon: best.lon,
        };
      }
    } catch (e) {
      // ignore
    }
    return item;
  }

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
      ) {
        lastPickedRef.current.pickup = null;
      }
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
      ) {
        lastPickedRef.current.from = null;
      }
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
      ) {
        lastPickedRef.current.to = null;
      }
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
      ) {
        lastPickedRef.current.airport = null;
      }
    }, 700);

    airportInputRef.current?.blur();
  };

  /* ------------- handlers ------------- */

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
          selectedLocalPlace || { label: localPickup },
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
          selectedFromPlace || { label: fromVal },
        drop: selectedToPlace || { label: toVal },
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
        if (!airportText.trim() || !toVal.trim()) {
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
          drop: selectedToPlace || { label: toVal },
          pickupDate: airportDate,
          pickupTime: airportTime,
        };
      }
    }

    if (payload) {
      try {
        console.log("SEARCH_PAYLOAD:", payload);
      } catch (e) {}
      onSearch(payload);
    }
  };

  /* ------------- UI ------------- */

  return (
    <section className="relative w-full min-h-[680px] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* background video */}
      <video
        className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-500 ${
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 z-10" />

      {/* content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6">
        {/* heading */}
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-sky-200/90">
            Book cab online
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            Local, Outstation & Airport Cabs in{" "}
            <span className="text-emerald-400">
              One Place
            </span>
          </h2>
        </div>

        {/* gradient bar like your laptop design */}
        <div className="bg-gradient-to-r from-[#4c1d95] via-[#4338ca] to-[#0ea5e9] rounded-2xl p-[1px] shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="bg-slate-950/85 rounded-2xl px-3 sm:px-5 py-4 sm:py-5">
            {/* top row: tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("local")
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all ${
                  service === "local"
                    ? "bg-white text-sky-700 shadow-[0_8px_24px_rgba(248,250,252,0.9)]"
                    : "bg-white/5 text-slate-100 border border-white/15 hover:bg-white/10"
                }`}
              >
                🏙 Local Rentals
              </button>
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("outstation")
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all ${
                  service === "outstation"
                    ? "bg-white text-sky-700 shadow-[0_8px_24px_rgba(248,250,252,0.9)]"
                    : "bg-white/5 text-slate-100 border border-white/15 hover:bg-white/10"
                }`}
              >
                🚗 Outstation
              </button>
              <button
                type="button"
                onClick={() =>
                  handleServiceChange("airport")
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm transition-all ${
                  service === "airport"
                    ? "bg-white text-sky-700 shadow-[0_8px_24px_rgba(248,250,252,0.9)]"
                    : "bg-white/5 text-slate-100 border border-white/15 hover:bg-white/10"
                }`}
              >
                ✈ Airport Transfer
              </button>

              {/* right side small toggles */}
              <div className="flex-1" />
              {service === "outstation" && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleTripTypeChange("oneway")
                    }
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      tripType === "oneway"
                        ? "bg-emerald-400 text-slate-900 border-emerald-300"
                        : "bg-white/5 text-slate-100 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    🚗 One Way
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleTripTypeChange("roundtrip")
                    }
                    className={`px-3 py-1.5 rounded-full border transition-all ${
                      tripType === "roundtrip"
                        ? "bg-emerald-400 text-slate-900 border-emerald-300"
                        : "bg-white/5 text-slate-100 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    🔄 Round Trip
                  </button>
                </div>
              )}

              {service === "airport" && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs">
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
                        ? "bg-emerald-400 text-slate-900 border-emerald-300"
                        : "bg-white/5 text-slate-100 border-white/20 hover:bg-white/10"
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
                        ? "bg-emerald-400 text-slate-900 border-emerald-300"
                        : "bg-white/5 text-slate-100 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    🛬 Pickup from Airport
                  </button>
                </div>
              )}
            </div>

            {/* FORM – desktop one-row like your ref, mobile stacked */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 text-xs sm:text-sm text-white"
            >
              {/* LOCAL */}
              {service === "local" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* pickup */}
                  <div
                    className="md:col-span-4 relative"
                    ref={pickupListRef}
                  >
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      From
                    </div>
                    <input
                      ref={pickupInputRef}
                      type="text"
                      value={localPickup}
                      onChange={(e) => {
                        setSelectedLocalPlace(null);
                        setLocalPickup(e.target.value);
                      }}
                      placeholder="City, locality, hotel, office..."
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                    {pickupOpen &&
                      pickupSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                          {pickupSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickLocal(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg">
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
                                      , {sug.state}
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
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      Package
                    </div>
                    <select
                      value={localPackage}
                      onChange={(e) =>
                        setLocalPackage(
                          e.target.value
                        )
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
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
                  <div className="md:col-span-3">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      Pickup Date
                    </div>
                    <input
                      type="date"
                      value={localDate}
                      min={todayISO}
                      onChange={(e) =>
                        setLocalDate(e.target.value)
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* time */}
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      Pickup Time
                    </div>
                    <input
                      type="time"
                      value={localTime}
                      onChange={(e) =>
                        setLocalTime(e.target.value)
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* button */}
                  <div className="md:col-span-1 flex">
                    <button
                      type="submit"
                      className="w-full h-[44px] mt-2 md:mt-5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-xs sm:text-sm shadow-[0_10px_30px_rgba(16,185,129,0.7)] hover:from-emerald-600 hover:to-green-600 active:scale-[0.97] transition"
                    >
                      🔍 SEARCH LOCAL CABS
                    </button>
                  </div>
                </div>
              )}

              {/* OUTSTATION */}
              {service === "outstation" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* from */}
                  <div
                    className="md:col-span-3 relative"
                    ref={fromListRef}
                  >
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      From City (India)
                    </div>
                    <input
                      ref={fromInputRef}
                      type="text"
                      value={fromVal}
                      onChange={(e) => {
                        setSelectedFromPlace(null);
                        setFromVal(e.target.value);
                      }}
                      placeholder="Source city"
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                    {fromOpen &&
                      fromSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                          {fromSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickFrom(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg">
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
                    className="md:col-span-3 relative"
                    ref={toListRef}
                  >
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      To City (India)
                    </div>
                    <input
                      ref={toInputRef}
                      type="text"
                      value={toVal}
                      onChange={(e) => {
                        setSelectedToPlace(null);
                        setToVal(e.target.value);
                      }}
                      placeholder="Destination city"
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                    {toOpen && toSug.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                        {toSug.map((sug) => (
                          <li
                            key={sug.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              pickTo(sug);
                            }}
                            className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                          >
                            <span className="text-lg">
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

                  {/* pickup date */}
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      {tripType === "oneway"
                        ? "Pickup Date"
                        : "Departure Date"}
                    </div>
                    <input
                      type="date"
                      value={outPickupDate}
                      min={todayISO}
                      onChange={(e) =>
                        setOutPickupDate(
                          e.target.value
                        )
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* pickup time */}
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      {tripType === "oneway"
                        ? "Pickup Time"
                        : "Departure Time"}
                    </div>
                    <input
                      type="time"
                      value={outPickupTime}
                      onChange={(e) =>
                        setOutPickupTime(
                          e.target.value
                        )
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* optional return */}
                  {tripType === "roundtrip" && (
                    <>
                      <div className="md:col-span-2">
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Return Date
                        </div>
                        <input
                          type="date"
                          value={outReturnDate}
                          min={minReturnDate}
                          onChange={(e) =>
                            setOutReturnDate(
                              e.target.value
                            )
                          }
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Return Time
                        </div>
                        <input
                          type="time"
                          value={outReturnTime}
                          onChange={(e) =>
                            setOutReturnTime(
                              e.target.value
                            )
                          }
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                      </div>
                    </>
                  )}

                  {/* button */}
                  <div className="md:col-span-2 flex">
                    <button
                      type="submit"
                      className="w-full h-[44px] mt-2 md:mt-5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-xs sm:text-sm shadow-[0_10px_30px_rgba(16,185,129,0.7)] hover:from-emerald-600 hover:to-green-600 active:scale-[0.97] transition"
                    >
                      {tripType === "oneway"
                        ? "🚗 SEARCH ONE WAY CABS"
                        : "🔄 SEARCH ROUND TRIP CABS"}
                    </button>
                  </div>
                </div>
              )}

              {/* AIRPORT */}
              {service === "airport" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {airportMode === "drop" ? (
                    <>
                      {/* pickup location */}
                      <div
                        className="md:col-span-3 relative"
                        ref={pickupListRef}
                      >
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Pickup Location (India)
                        </div>
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
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                        {pickupOpen &&
                          pickupSug.length > 0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                              {pickupSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickLocal(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-lg">
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
                                            ,{" "}
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
                        className="md:col-span-3 relative"
                        ref={airportListRef}
                      >
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Drop Airport
                        </div>
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
                          placeholder="Airport name or code"
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                        {airportOpen &&
                          airportSug.length >
                            0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                              {airportSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickAirport(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-lg">
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
                        className="md:col-span-3 relative"
                        ref={airportListRef}
                      >
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Pickup Airport
                        </div>
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
                          placeholder="Airport name or code"
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                        {airportOpen &&
                          airportSug.length >
                            0 && (
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                              {airportSug.map(
                                (sug) => (
                                  <li
                                    key={sug.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      pickAirport(
                                        sug
                                      );
                                    }}
                                    className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                                  >
                                    <span className="text-lg">
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
                        className="md:col-span-3 relative"
                        ref={toListRef}
                      >
                        <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                          Drop Location (India)
                        </div>
                        <input
                          ref={toInputRef}
                          type="text"
                          value={toVal}
                          onChange={(e) => {
                            setSelectedToPlace(null);
                            setToVal(
                              e.target.value
                            );
                          }}
                          placeholder="Home / Hotel / Office..."
                          className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                        />
                        {toOpen && toSug.length > 0 && (
                          <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-xs">
                            {toSug.map((sug) => (
                              <li
                                key={sug.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  pickTo(sug);
                                }}
                                className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                              >
                                <span className="text-lg">
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
                                        ,{" "}
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
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      Pickup Date
                    </div>
                    <input
                      type="date"
                      value={airportDate}
                      min={todayISO}
                      onChange={(e) =>
                        setAirportDate(
                          e.target.value
                        )
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* time */}
                  <div className="md:col-span-2">
                    <div className="mb-1 text-[11px] sm:text-xs text-slate-200/80">
                      Pickup Time
                    </div>
                    <input
                      type="time"
                      value={airportTime}
                      onChange={(e) =>
                        setAirportTime(
                          e.target.value
                        )
                      }
                      className="w-full h-[44px] rounded-lg bg-white text-slate-900 px-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                    />
                  </div>

                  {/* button */}
                  <div className="md:col-span-2 flex">
                    <button
                      type="submit"
                      className="w-full h-[44px] mt-2 md:mt-5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-xs sm:text-sm shadow-[0_10px_30px_rgba(16,185,129,0.7)] hover:from-emerald-600 hover:to-green-600 active:scale-[0.97] transition"
                    >
                      ✈ SEARCH AIRPORT CABS
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
