  return (
    <section className="relative w-full bg-gradient-to-r from-[#4b1fc7] via-[#3f3fcf] to-[#1398c5] py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-6 text-white">
        {/* Heading */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            Book cab Online
          </h2>
        </div>

        {/* Service tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleServiceChange("local")}
            className={`px-4 md:px-6 py-2 rounded-md text-sm md:text-base font-medium shadow-md transition-colors ${
              service === "local"
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Local Trip
          </button>
          <button
            type="button"
            onClick={() => handleServiceChange("outstation")}
            className={`px-4 md:px-6 py-2 rounded-md text-sm md:text-base font-medium shadow-md transition-colors ${
              service === "outstation"
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Outstation Trip
          </button>
          <button
            type="button"
            onClick={() => handleServiceChange("airport")}
            className={`px-4 md:px-6 py-2 rounded-md text-sm md:text-base font-medium shadow-md transition-colors ${
              service === "airport"
                ? "bg-white text-slate-900"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Airport
          </button>
        </div>

        {/* Top small toggles (Outstation / Airport options) */}
        <div className="flex justify-center mb-4">
          {service === "outstation" && (
            <div className="flex gap-2 text-xs md:text-sm">
              <button
                type="button"
                onClick={() => handleTripTypeChange("oneway")}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  tripType === "oneway"
                    ? "bg-white text-slate-900 border-transparent"
                    : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
                }`}
              >
                🚗 One Way
              </button>
              <button
                type="button"
                onClick={() => handleTripTypeChange("roundtrip")}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  tripType === "roundtrip"
                    ? "bg-white text-slate-900 border-transparent"
                    : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
                }`}
              >
                🔁 Round Trip
              </button>
            </div>
          )}

          {service === "airport" && (
            <div className="flex gap-2 text-xs md:text-sm">
              <button
                type="button"
                onClick={() => {
                  setAirportMode("drop");
                  setSelectedAirportItem(null);
                  setAirportText("");
                  setToVal("");
                  setSelectedToPlace(null);
                }}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  airportMode === "drop"
                    ? "bg-white text-slate-900 border-transparent"
                    : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
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
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  airportMode === "pickup"
                    ? "bg-white text-slate-900 border-transparent"
                    : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20"
                }`}
              >
                🛬 Pickup from Airport
              </button>
            </div>
          )}
        </div>

        {/* MAIN WHITE STRIP CARD – desktop strip, mobile stack */}
        <div className="bg-white rounded-md shadow-2xl overflow-hidden">
          {/* ------------ FORM ------------- */}
          <form onSubmit={handleSubmit} className="p-4 md:p-5">
            {/* LOCAL TRIP LAYOUT */}
            {service === "local" && (
              <div className="flex flex-col md:flex-row md:items-stretch gap-3">
                {/* FROM / PICKUP */}
                <div
                  className="relative flex-1"
                  ref={pickupListRef}
                >
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    From
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                    <input
                      ref={pickupInputRef}
                      type="text"
                      value={localPickup}
                      onChange={(e) => {
                        setSelectedLocalPlace(null);
                        setLocalPickup(e.target.value);
                      }}
                      placeholder="Mumbai, Maharashtra, India"
                      className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {pickupOpen && pickupSug.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                      {pickupSug.map((sug) => (
                        <li
                          key={sug.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickLocal(sug);
                          }}
                          className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          <span className="text-lg flex-shrink-0">
                            {getPlaceIcon(sug.label)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-800 font-medium truncate">
                              {sug.name || sug.label}
                            </div>
                            <div className="text-[11px] text-gray-500 truncate">
                              {sug.city && <span>{sug.city}</span>}
                              {sug.state && <span>, {sug.state}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* PACKAGE */}
                <div className="w-full md:w-52">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Package
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <select
                      value={localPackage}
                      onChange={(e) => setLocalPackage(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    >
                      <option value="8x80">8 Hours 80 Km</option>
                      <option value="12x120">12 Hours 120 Km</option>
                      <option value="full">Full Day 250 Km</option>
                    </select>
                  </div>
                </div>

                {/* DATE */}
                <div className="w-full md:w-48">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Departure
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="date"
                      value={localDate}
                      min={todayISO}
                      onChange={(e) => setLocalDate(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* TIME */}
                <div className="w-full md:w-40">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Pickup Time
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="time"
                      value={localTime}
                      onChange={(e) => setLocalTime(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* SEARCH BUTTON */}
                <div className="w-full md:w-40 flex items-end">
                  <button
                    type="submit"
                    className="w-full md:h-[48px] bg-[#ff424d] text-white font-semibold text-sm md:text-base rounded-md shadow-md hover:bg-[#ff3240] transition-colors"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
            )}

            {/* OUTSTATION LAYOUT */}
            {service === "outstation" && (
              <div className="flex flex-col md:flex-row md:items-stretch gap-3">
                {/* From */}
                <div className="relative flex-1" ref={fromListRef}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    From City (India)
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                    <input
                      ref={fromInputRef}
                      type="text"
                      value={fromVal}
                      onChange={(e) => {
                        setSelectedFromPlace(null);
                        setFromVal(e.target.value);
                      }}
                      placeholder="Source city"
                      className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  {fromOpen && fromSug.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                      {fromSug.map((sug) => (
                        <li
                          key={sug.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickFrom(sug);
                          }}
                          className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          <span className="text-lg">🏙</span>
                          <div className="text-gray-800 font-medium">{sug.label}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* To */}
                <div className="relative flex-1" ref={toListRef}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    To City (India)
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                    <input
                      ref={toInputRef}
                      type="text"
                      value={toVal}
                      onChange={(e) => {
                        setSelectedToPlace(null);
                        setToVal(e.target.value);
                      }}
                      placeholder="Destination city"
                      className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  {toOpen && toSug.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                      {toSug.map((sug) => (
                        <li
                          key={sug.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickTo(sug);
                          }}
                          className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          <span className="text-lg">🏙</span>
                          <div className="text-gray-800 font-medium">{sug.label}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Date */}
                <div className="w-full md:w-44">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    {tripType === "oneway" ? "Pickup Date" : "Departure Date"}
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="date"
                      value={outPickupDate}
                      min={todayISO}
                      onChange={(e) => setOutPickupDate(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="w-full md:w-40">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    {tripType === "oneway" ? "Pickup Time" : "Departure Time"}
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="time"
                      value={outPickupTime}
                      onChange={(e) => setOutPickupTime(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Return (only roundtrip) – on desktop second line feel, but simple */}
                {tripType === "roundtrip" && (
                  <>
                    <div className="w-full md:w-44">
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Return Date
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                        <input
                          type="date"
                          value={outReturnDate}
                          min={minReturnDate}
                          onChange={(e) => setOutReturnDate(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-40">
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Return Time
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                        <input
                          type="time"
                          value={outReturnTime}
                          onChange={(e) => setOutReturnTime(e.target.value)}
                          className="w-full bg-transparent text-sm outline-none text-slate-900"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Search button */}
                <div className="w-full md:w-40 flex items-end">
                  <button
                    type="submit"
                    className="w-full md:h-[48px] bg-[#ff424d] text-white font-semibold text-sm md:text-base rounded-md shadow-md hover:bg-[#ff3240] transition-colors"
                  >
                    {tripType === "oneway"
                      ? "SEARCH"
                      : "SEARCH"}
                  </button>
                </div>
              </div>
            )}

            {/* AIRPORT LAYOUT */}
            {service === "airport" && (
              <div className="flex flex-col md:flex-row md:items-stretch gap-3">
                {airportMode === "drop" ? (
                  <>
                    {/* pickup from home */}
                    <div className="relative flex-1" ref={pickupListRef}>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Pickup Location (India)
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                        <input
                          ref={pickupInputRef}
                          type="text"
                          value={localPickup}
                          onChange={(e) => {
                            setSelectedLocalPlace(null);
                            setLocalPickup(e.target.value);
                          }}
                          placeholder="Home / Hotel / Office..."
                          className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {pickupOpen && pickupSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                          {pickupSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickLocal(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg flex-shrink-0">
                                {getPlaceIcon(sug.label)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-800 font-medium truncate">
                                  {sug.name || sug.label}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {sug.city && <span>{sug.city}</span>}
                                  {sug.state && <span>, {sug.state}</span>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* airport */}
                    <div className="relative flex-1" ref={airportListRef}>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Drop Airport
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                        <input
                          ref={airportInputRef}
                          type="text"
                          value={airportText}
                          onChange={(e) => {
                            setSelectedAirportItem(null);
                            setAirportText(e.target.value);
                          }}
                          placeholder="Enter airport name or code"
                          className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {airportOpen && airportSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                          {airportSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickAirport(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg">✈</span>
                              <div className="text-gray-800 font-medium truncate">
                                {sug.label}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* pickup from airport */}
                    <div className="relative flex-1" ref={airportListRef}>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Pickup Airport
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                        <input
                          ref={airportInputRef}
                          type="text"
                          value={airportText}
                          onChange={(e) => {
                            setSelectedAirportItem(null);
                            setAirportText(e.target.value);
                          }}
                          placeholder="Enter airport name or code"
                          className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {airportOpen && airportSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                          {airportSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickAirport(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg">✈</span>
                              <div className="text-gray-800 font-medium truncate">
                                {sug.label}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* drop location */}
                    <div className="relative flex-1" ref={toListRef}>
                      <p className="text-xs font-semibold text-slate-500 mb-1">
                        Drop Location (India)
                      </p>
                      <div className="border border-slate-200 rounded-md px-3 py-2 flex items-center h-full">
                        <input
                          ref={toInputRef}
                          type="text"
                          value={toVal}
                          onChange={(e) => {
                            setSelectedToPlace(null);
                            setToVal(e.target.value);
                          }}
                          placeholder="Home / Hotel / Office..."
                          className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      {toOpen && toSug.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white rounded-md shadow-xl border border-gray-200 z-50 text-sm">
                          {toSug.map((sug) => (
                            <li
                              key={sug.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickTo(sug);
                              }}
                              className="cursor-pointer px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                            >
                              <span className="text-lg flex-shrink-0">
                                {getPlaceIcon(sug.label)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-800 font-medium truncate">
                                  {sug.name || sug.label}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {sug.city && <span>{sug.city}</span>}
                                  {sug.state && <span>, {sug.state}</span>}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}

                {/* Date */}
                <div className="w-full md:w-44">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Pickup Date
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="date"
                      value={airportDate}
                      min={todayISO}
                      onChange={(e) => setAirportDate(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="w-full md:w-40">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Pickup Time
                  </p>
                  <div className="border border-slate-200 rounded-md px-3 py-2 h-full flex items-center">
                    <input
                      type="time"
                      value={airportTime}
                      onChange={(e) => setAirportTime(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none text-slate-900"
                    />
                  </div>
                </div>

                {/* Search button */}
                <div className="w-full md:w-40 flex items-end">
                  <button
                    type="submit"
                    className="w-full md:h-[48px] bg-[#ff424d] text-white font-semibold text-sm md:text-base rounded-md shadow-md hover:bg-[#ff3240] transition-colors"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
