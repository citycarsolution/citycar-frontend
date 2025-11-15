// frontend/src/admin/components/AssignDriverModal.jsx
import React, { useEffect, useState } from "react";

export default function AssignDriverModal({ booking, onClose, onAssigned }) {
  const [drivers, setDrivers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/drivers`);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDrivers([]);
    }
  };

  const handleAssign = async () => {
    if (!selected) return alert("Select a driver");
    setSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/${booking._id}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Assign failed");

      if (data.waDriver) window.open(data.waDriver, "_blank");
      if (data.waCustomer) setTimeout(()=> window.open(data.waCustomer, "_blank"), 600);

      onAssigned && onAssigned(data.booking || data);
    } catch (err) {
      console.error(err); alert("Assign failed");
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-[420px]">
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold text-lg">Assign Driver — {booking?.bookingId}</div>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="space-y-2 max-h-64 overflow-auto">
          {drivers.length === 0 && <div className="text-sm text-gray-500">No drivers found.</div>}
          {drivers.map(d => (
            <div key={d._id} onClick={() => setSelected(d._id)} className={`p-3 border rounded cursor-pointer ${selected===d._id ? 'ring-2 ring-[#0B162C]' : ''}`}>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-500">{d.phone} • {d.carModel || '—'}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={handleAssign} disabled={sending} className="px-4 py-2 bg-[#0B162C] text-white rounded">{sending ? "Assigning..." : "Assign & Notify"}</button>
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
