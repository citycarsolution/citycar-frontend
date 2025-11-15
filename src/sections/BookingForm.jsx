import React, { useMemo, useState } from "react";

const SERVICES = [
  { id: "airport",   icon: "✈️", label: "Airport Transfer" },
  { id: "local",     icon: "🏙️", label: "Local Rental" },
  { id: "oneway",    icon: "🚗", label: "Outstation — One Way" },
  { id: "roundtrip", icon: "🔄", label: "Outstation — Round Trip" },
];

export default function BookingForm({ selectedCar, searchParams, onBack, onBooked, qrImageUrl }) {
  const todayISO = new Date().toISOString().split("T")[0];
  const defaultTime = new Date(Date.now() + 3600000).toTimeString().slice(0, 5);

  const initialService = searchParams?.service || "airport";
  const serviceLabel = SERVICES.find(s => s.id === initialService)?.label || "Service";

  const carTitleMap = {
    sedan: "Sedan — Dzire/Xcent",
    ertiga: "SUV — Ertiga",
    carens: "SUV — Kia Carens",
    crysta: "SUV — Innova Crysta",
    hycross: "SUV — Innova Hycross",
  };

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    pickup: searchParams?.pickup?.label || "",
    drop: (searchParams?.drop?.label || searchParams?.airport?.label || ""),
    date: searchParams?.pickupDate || todayISO,
    time: searchParams?.pickupTime || defaultTime,
    payment: "cash",
    upiId: "",
  });

  const [showQr, setShowQr] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const valid = useMemo(() => {
    const basic = form.firstName && form.phone && form.pickup && form.date && form.time;
    return form.payment === "upi" ? basic && form.upiId : basic;
  }, [form]);

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onBooked?.({
      ...form,
      service: initialService,
      serviceLabel,
      carId: selectedCar?.carId,
      carTitle: carTitleMap[selectedCar?.carId] || "—",
      km: selectedCar?.km ?? 0,
      waitMin: selectedCar?.waitMin ?? 0,
      days: selectedCar?.days ?? 1,
      fareTotal: selectedCar?.fare?.total ? Math.round(selectedCar.fare.total) : undefined,
    });
  };

  const QRCard = () => {
    const displayUpi = form.upiId || "yourname@upi";
    return (
      <div className="max-w-sm mx-auto bg-white rounded-xl shadow-lg p-4 text-center">
        {qrImageUrl ? (
          <img src={qrImageUrl} alt="UPI QR" className="mx-auto w-64 h-64 object-contain rounded-md" />
        ) : (
          <div className="mx-auto w-64 h-64 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-600">
            <div>
              <div className="font-medium mb-2">Scan to pay</div>
              <div className="text-xs">(no QR image provided)</div>
            </div>
          </div>
        )}
        <div className="mt-3 text-sm text-gray-700">
          <div className="font-medium">UPI ID</div>
          <div className="mt-1 break-all">{displayUpi}</div>
        </div>
      </div>
    );
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold">
          Final Booking — {serviceLabel}
        </h2>
        <button onClick={onBack} className="text-sm px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
          ← Back to Results
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm mb-5 text-sm">
        <div className="font-medium">Selected Car: {carTitleMap[selectedCar?.carId] || "—"}</div>
        <div className="mt-1 text-gray-600">
          Estimated distance: <b>{selectedCar?.km ?? 0} km</b>
          {typeof selectedCar?.fare?.total === "number" && (
            <> • Estimated fare: <b>₹ {selectedCar.fare.total.toLocaleString("en-IN")}</b></>
          )}
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 bg-[#0B162C] text-white">
          <h3 className="text-lg font-semibold">Passenger & Trip Details</h3>
          <p className="text-xs opacity-90">Fields marked * are required.</p>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* FIRST NAME */}
          <div>
            <label className="text-sm">First Name *</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="e.g., Rahul"
              required
            />
          </div>

          {/* LAST NAME */}
          <div>
            <label className="text-sm">Last Name</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="Kumar"
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="text-sm">Mobile Number *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="10-digit number"
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="text-sm">Gmail ID</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="yourname@gmail.com"
            />
          </div>

          {/* PICKUP */}
          <div className="sm:col-span-2">
            <label className="text-sm">Pickup Address *</label>
            <input
              name="pickup"
              value={form.pickup}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="House/Street, Area, City"
              required
            />
          </div>

          {/* DROP */}
          <div className="sm:col-span-2">
            <label className="text-sm">Drop Address</label>
            <input
              name="drop"
              value={form.drop}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              placeholder="Destination address"
            />
          </div>

          {/* DATE */}
          <div>
            <label className="text-sm">Pickup Date *</label>
            <input
              type="date"
              name="date"
              min={todayISO}
              value={form.date}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              required
            />
          </div>

          {/* TIME */}
          <div>
            <label className="text-sm">Pickup Time *</label>
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={onChange}
              className="mt-1 w-full p-3 border rounded-md"
              required
            />
          </div>

          {/* PAYMENT */}
          <div className="sm:col-span-2">
            <label className="text-sm">Payment Method *</label>
            <div className="mt-2 flex flex-wrap gap-3">

              {/* CASH */}
              <label className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={form.payment === "cash"}
                  onChange={onChange}
                />
                Cash
              </label>

              {/* UPI */}
              <label
                className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 cursor-pointer"
                onClick={() => {
                  setForm(f => ({ ...f, payment: "upi" }));
                  setTimeout(() => setShowQr(true), 100);
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={form.payment === "upi"}
                  onChange={onChange}
                />
                UPI
              </label>
            </div>
          </div>

          {/* UPI EXTRA FIELDS */}
          {form.payment === "upi" && (
            <>
              <div className="sm:col-span-2">
                <label className="text-sm">UPI ID *</label>
                <input
                  name="upiId"
                  value={form.upiId}
                  onChange={onChange}
                  className="mt-1 w-full p-3 border rounded-md"
                  placeholder="yourname@upi"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  Show QR
                </button>
                <div className="text-sm text-gray-600">
                  User can scan QR or copy UPI ID to pay.
                </div>
              </div>
            </>
          )}

          {/* SUBMIT */}
          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={!valid}
              className={`w-full py-3 rounded-lg text-white font-semibold ${valid ? "" : "opacity-60 cursor-not-allowed"}`}
              style={{ backgroundColor: "#E11D48" }}
            >
              Final Booking
            </button>
          </div>

        </form>
      </div>

      {/* QR MODAL */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQr(false)} />
          <div className="relative z-10 w-full max-w-md">
            <div className="bg-white rounded-xl p-5 shadow-xl">
              
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-lg">Pay with UPI</h4>
                <button onClick={() => setShowQr(false)} className="text-gray-500 hover:text-gray-800">✕</button>
              </div>

              <QRCard />

              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 py-2 rounded-md border"
                  onClick={() => {
                    const text = form.upiId || "";
                    if (text) {
                      navigator.clipboard?.writeText(text).then(() => alert("UPI ID copied to clipboard"));
                    } else {
                      alert("Please enter UPI ID first");
                    }
                  }}
                >
                  Copy UPI ID
                </button>

                <button
                  className="flex-1 py-2 rounded-md bg-rose-500 text-white"
                  onClick={() => {
                    const upi = form.upiId;
                    if (!upi) return alert("Please enter UPI ID");
                    const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent("Merchant")}&cu=INR`;
                    window.location.href = url;
                  }}
                >
                  Open UPI App
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Close this dialog after payment and then submit booking.
              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
