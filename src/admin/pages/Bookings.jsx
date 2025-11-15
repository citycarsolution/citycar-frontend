// frontend/src/admin/pages/Bookings.jsx
import React, { useEffect, useState } from "react";
import AssignDriverModal from "../components/AssignDriverModal";
import SendBillModal from "../components/SendBillModal";
import CancelModal from "../components/CancelModal";

const BRAND = "#0B162C";

function parseNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[,₹\s]/g, "").replace(/[^0-9.\-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function computeTotalFromBooking(b) {
  // Try many possible fields
  const candidates = [
    b?.fare?.total,
    b?.total,
    b?.estimatedFare,
    b?.price,
    b?.amount,
    b?.fare?.amount,
    b?.fare?.estimated
  ];

  for (const c of candidates) {
    const val = parseNumber(c);
    if (val !== 0) return val;
  }

  // Compute from parts if available
  const base = parseNumber(b?.fare?.base ?? b?.base);
  const extras = parseNumber(b?.fare?.extras ?? 0);
  const tolls = parseNumber(b?.fare?.tolls ?? 0);
  const discount = parseNumber(b?.fare?.discount ?? 0);
  const calc = base + extras + tolls - discount;
  if (calc !== 0) return calc;

  return 0;
}

function fmtINR(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/bookings`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Bookings load error:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onAssigned = (updatedBooking) => {
    setBookings(prev => prev.map(p => (p._id === updatedBooking._id ? updatedBooking : p)));
    setShowAssign(false);
  };

  const onBillSent = (updatedBooking) => {
    setBookings(prev => prev.map(p => (p._id === updatedBooking._id ? updatedBooking : p)));
    setShowBill(false);
  };

  const onCancelled = (updatedBooking) => {
    setBookings(prev => prev.map(p => (p._id === updatedBooking._id ? updatedBooking : p)));
    setShowCancel(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Bookings</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-semibold text-gray-700">
                  <th className="p-2">ID</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Pickup → Drop</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-6 text-center text-gray-500">No bookings</td>
                  </tr>
                )}

                {bookings.map(b => {
                  const total = computeTotalFromBooking(b);
                  return (
                    <tr key={b._id} className="border-t">
                      <td className="p-2 align-top text-xs text-gray-700">{b.bookingId || "—"}</td>

                      <td className="p-2 align-top">
                        <div className="font-medium">{b.customerName || "—"}</div>
                        <div className="text-xs text-gray-500">{b.customerPhone || ""}</div>
                      </td>

                      <td className="p-2 align-top">
                        <div className="font-medium">{b.serviceLabel || b.serviceType || "—"}</div>
                        <div className="text-xs text-gray-500">{b.carTitle || ""}</div>
                      </td>

                      <td className="p-2 align-top text-gray-700">{b.pickup || "—"}{b.drop ? ` → ${b.drop}` : ""}</td>

                      <td className="p-2 align-top font-semibold text-gray-800">{ total ? fmtINR(total) : "—" }</td>

                      <td className="p-2 align-top">
                        <div className="text-sm">{b.paymentMethod || "—"}</div>
                        <div className={`text-xs ${b.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>{b.paymentStatus || 'Unpaid'}</div>
                      </td>

                      <td className="p-2 align-top">
                        {b.driverName ? (
                          <div>
                            <div className="font-medium">{b.driverName}</div>
                            <div className="text-xs text-gray-500">{b.driverPhone}</div>
                          </div>
                        ) : "—"}
                      </td>

                      <td className="p-2 align-top">{b.status || "Pending"}</td>

                      <td className="p-2 align-top space-x-2">
                        <button onClick={() => { setSelected(b); setShowAssign(true); }} className="px-3 py-1 bg-[#0B162C] text-white rounded">Assign</button>
                        <button onClick={() => { setSelected(b); setShowBill(true); }} className="px-3 py-1 bg-green-600 text-white rounded">Bill</button>
                        <button onClick={() => { setSelected(b); setShowCancel(true); }} className="px-3 py-1 bg-red-500 text-white rounded">Cancel</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAssign && selected && <AssignDriverModal booking={selected} onClose={()=>setShowAssign(false)} onAssigned={onAssigned} />}
      {showBill && selected && <SendBillModal booking={selected} onClose={()=>setShowBill(false)} onSent={onBillSent} />}
      {showCancel && selected && <CancelModal booking={selected} onClose={()=>setShowCancel(false)} onCancelled={onCancelled} />}
    </div>
  );
}
