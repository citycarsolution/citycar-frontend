// frontend/src/admin/components/CancelModal.jsx
import React, { useState } from "react";

export default function CancelModal({ booking, onClose, onCancelled }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  if (!booking) return null;

  const handleCancel = async () => {
    if (!reason.trim()) return alert("Reason required");
    setSending(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/${booking._id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, cancelledBy: "Admin" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Cancel failed");

      if (data.waDriver) window.open(data.waDriver, "_blank");
      if (data.waCustomer) setTimeout(()=> window.open(data.waCustomer, "_blank"), 400);

      onCancelled && onCancelled(data.booking || data);
      onClose();
    } catch (err) {
      console.error(err); alert("Cancel failed");
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-4 w-[420px]">
        <h3 className="font-semibold mb-3">Cancel Booking — {booking?.bookingId}</h3>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for cancel" className="w-full p-2 border rounded h-28" />
        <div className="mt-3 flex gap-2">
          <button onClick={handleCancel} disabled={sending} className="px-4 py-2 bg-red-600 text-white rounded">{sending ? "Cancelling..." : "Confirm Cancel"}</button>
          <button onClick={onClose} className="px-4 py-2 border rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
