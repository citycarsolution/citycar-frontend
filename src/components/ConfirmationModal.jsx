// frontend/src/components/ConfirmationModal.jsx
import React, { useState } from "react";

const BRAND = "#0B162C";

function fmtINR(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

function parseNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function computeFareTotal(booking) {
  if (!booking) return 0;
  
  console.log("DEBUG_FARE_CALCULATION:", {
    fare: booking.fare,
    total: booking.total,
    estimatedFare: booking.estimatedFare,
    price: booking.price,
    amount: booking.amount,
    selectedCar: booking.selectedCar
  });

  // Priority 1: Direct fare.total from booking or selectedCar
  if (booking.fare?.total != null && parseNumber(booking.fare.total) > 0) {
    return parseNumber(booking.fare.total);
  }
  
  // Priority 2: selectedCar fare total
  if (booking.selectedCar?.fare?.total != null && parseNumber(booking.selectedCar.fare.total) > 0) {
    return parseNumber(booking.selectedCar.fare.total);
  }
  
  // Priority 3: Top-level total fields
  const topLevelFields = [
    booking.total,
    booking.estimatedFare,
    booking.price,
    booking.amount,
    booking.fareTotal
  ];
  
  for (const field of topLevelFields) {
    if (field != null && parseNumber(field) > 0) {
      return parseNumber(field);
    }
  }
  
  // Priority 4: Compute from fare breakdown
  const base = parseNumber(booking.fare?.base || booking.base || 0);
  const extras = parseNumber(booking.fare?.extras || 0);
  const tolls = parseNumber(booking.fare?.tolls || 0);
  const discount = parseNumber(booking.fare?.discount || 0);
  
  const calculated = base + extras + tolls - discount;
  if (calculated > 0) return calculated;
  
  // Priority 5: Service-based fallback
  const service = String(booking.serviceLabel || booking.service || booking.serviceType || "").toLowerCase();
  if (service.includes("airport")) return 1000;
  if (service.includes("outstation")) return 2000;
  if (service.includes("local")) return 800;
  
  return 0;
}

export default function ConfirmationModal({ open, booking, onClose }) {
  const [saving, setSaving] = useState(false);
  if (!open || !booking) return null;

  const labelOf = (v) => (v && (v.label || v.address || v.name)) || v || "";
  const fareTotal = computeFareTotal(booking);

  const normalizedPaymentMethod = (pm) => {
    if (!pm) return "Cash";
    const s = String(pm).trim().toLowerCase();
    if (s === "cash") return "Cash";
    if (s === "upi") return "UPI";
    if (s === "online") return "Online";
    if (s === "wallet") return "Wallet";
    return pm;
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const payload = {
        customerName: booking.firstName || booking.name || booking.customerName || "Guest",
        customerPhone: booking.phone || booking.customerPhone || booking.mobile || "",
        customerEmail: booking.email || booking.customerEmail || "",
        pickup: labelOf(booking.pickup),
        drop: labelOf(booking.drop),
        date: booking.date || "",
        time: booking.time || "",
        serviceType: booking.serviceType || booking.service || "local",
        serviceLabel: booking.serviceLabel || booking.service || "",
        carTitle: booking.carTitle || booking.car || booking.selectedCar?.carTitle || "",
        selectedCar: booking.selectedCar, // Include selectedCar for fare calculation
        fare: {
          base: parseNumber(booking.fare?.base || booking.base || 0),
          extras: parseNumber(booking.fare?.extras || 0),
          tolls: parseNumber(booking.fare?.tolls || 0),
          discount: parseNumber(booking.fare?.discount || 0),
          total: parseNumber(fareTotal)
        },
        total: fareTotal, // Add top-level total
        estimatedFare: fareTotal, // Add estimatedFare
        paymentMethod: normalizedPaymentMethod(booking.paymentMethod || booking.payment || "Cash"),
        paymentStatus: booking.paymentStatus || "Unpaid",
        notes: booking.notes || ""
      };

      console.log("DEBUG_CONFIRM_PAYLOAD", payload);

      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${base}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || JSON.stringify(data) || "Server error");

      alert("✅ Booking saved.");
      onClose?.();
    } catch (err) {
      console.error("Booking save exception:", err);
      alert("❌ Booking save failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-3" style={{ background: BRAND, color: "#fff" }}>
          <div className="text-base font-semibold">Booking Summary</div>
        </div>

        <div className="p-5 space-y-2">
          <Row label="Service" value={booking.serviceLabel || booking.service || booking.serviceType} />
          <Row label="Name" value={`${booking.firstName || booking.name || booking.customerName || ""} ${booking.lastName || ""}`.trim()} />
          <Row label="Mobile" value={booking.phone || booking.customerPhone || booking.mobile} />
          <Row label="Email" value={booking.email || booking.customerEmail} />
          <Row label="Pickup" value={labelOf(booking.pickup)} />
          <Row label="Drop" value={labelOf(booking.drop)} />
          <Row label="Date/Time" value={`${booking.date || ""} • ${booking.time || ""}`} />
          <Row label="Car" value={booking.carTitle || booking.car || booking.selectedCar?.carTitle || ""} />
          <Row label="Payment" value={normalizedPaymentMethod(booking.paymentMethod || booking.payment || "Cash")} />
          <Row label="Estimated Fare" value={fareTotal ? fmtINR(fareTotal) : "—"} />

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={handleConfirmSave} 
              disabled={saving} 
              className="px-4 py-3 rounded-lg text-white bg-[#E11D48] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Confirm & Save"}
            </button>

            <button onClick={onClose} className="px-4 py-3 rounded-lg border">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="w-28 shrink-0 text-gray-500">{label}</span>
    <span className="font-medium text-gray-800 break-words flex-1">{value || "—"}</span>
  </div>
);