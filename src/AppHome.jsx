import React, { useState } from "react";
import Hero from "./sections/Hero";
import Results from "./sections/Results";
import BookingForm from "./sections/BookingForm";
import ConfirmationModal from "./components/ConfirmationModal";
import InfoSections from "./sections/InfoSections";

export default function AppHome() {
  const [step, setStep] = useState("hero");
  const [selectedCar, setSelectedCar] = useState(null);
  const [booking, setBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useState(null);

  return (
    <>
      {step === "hero" && (
        <>
          <Hero
            onSearch={(payload) => {
              setSearchParams(payload);
              setStep("results");
            }}
          />
          <InfoSections />
        </>
      )}

      {step === "results" && searchParams && (
        <Results
          initialService={searchParams?.service || "local"}
          searchParams={searchParams}
          onBack={() => setStep("hero")}
          onSelect={(car) => {
            setSelectedCar(car);
            setStep("booking");
          }}
        />
      )}

      {step === "booking" && selectedCar && searchParams && (
        <BookingForm
          selectedCar={selectedCar}
          searchParams={searchParams}
          onBack={() => setStep("results")}
          onBooked={(data) => {
            setBooking(data);
            setModalOpen(true);
          }}
        />
      )}

      <ConfirmationModal
        open={modalOpen}
        booking={booking}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}