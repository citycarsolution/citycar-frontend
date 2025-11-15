// frontend/src/admin/components/SendBillModal.jsx
import React, { useState } from "react";

export default function SendBillModal({ booking, onClose, onSent }) {
  const [amount, setAmount] = useState(booking?.fare?.total ?? "");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const sendBill = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/${booking._id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fare: { total: Number(amount) }, paymentMethod: booking.paymentMethod || "Cash" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.waLink) window.open(data.waLink, "_blank");
      onSent && onSent(data.booking || data);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Send bill failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-5 w-[380px]">
        <h3 className="font-semibold text-lg mb-3">Send Final Bill — {booking.bookingId}</h3>

        <input value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="Total Amount" className="w-full p-2 border rounded mb-3" />

        <div className="flex gap-2">
          <button onClick={sendBill} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? "Sending..." : "Send Bill"}</button>
          <button onClick={onClose} className="border px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  );
}
