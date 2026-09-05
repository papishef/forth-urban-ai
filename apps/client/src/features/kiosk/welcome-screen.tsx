import { useKiosk } from "./use-kiosk.js";

export function WelcomeScreen() {
  const { goToStep } = useKiosk();

  return (
    <div className="kiosk-content-width w-full max-w-2xl mx-auto text-center">
      {/* Welcome message */}
      <h2 className="text-4xl font-bold mb-4" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Welcome
      </h2>
      <p className="text-xl mb-12" style={{ color: "#181818" }}>
        Are you here for an inspection or a meeting?
      </p>

      {/* Two main buttons */}
      <div className="kiosk-action-grid grid grid-cols-2 gap-8 max-w-xl mx-auto">
        {/* Check In Button */}
        <button
          onClick={() => goToStep("type-select")}
          className="relative group"
        >
          <div
            className="p-12 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
            style={{
              backgroundColor: "#FFF",
              border: `3px solid #5C4033`,
            }}
          >
            <div className="text-6xl mb-4">✓</div>
            <span className="text-2xl font-bold" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
              CHECK IN
            </span>
          </div>
          {/* Pulse animation */}
          <div
            className="absolute inset-0 rounded-2xl animate-pulse"
            style={{
              backgroundColor: "#5C4033",
              opacity: 0.1,
            }}
          />
        </button>

        {/* Check Out Button */}
        <button
          onClick={() => goToStep("check-out")}
          className="relative group"
        >
          <div
            className="p-12 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
            style={{
              backgroundColor: "#FFF",
              border: `3px solid #5C4033`,
            }}
          >
            <div className="text-6xl mb-4">←</div>
            <span className="text-2xl font-bold" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
              CHECK OUT
            </span>
          </div>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-12 text-sm" style={{ color: "#666" }}>
        <p>Tap a button to get started</p>
      </div>
    </div>
  );
}
