import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useKiosk } from "./use-kiosk.js";
import type { CheckInInput } from "@forth-urban/validation";
import { playKioskErrorSound, playKioskSuccessSound } from "./kiosk-feedback";
import { kioskFetch } from "./kiosk-api.js";

async function readResponse(response: Response): Promise<{ message?: string; data?: { _id: string } }> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { message?: string; data?: { _id: string } };
  } catch {
    return {};
  }
}

export function CheckInScreen() {
  const { session, updateFormData, setSuccess, setError, logout } = useKiosk();
  const [currentStep, setCurrentStep] = useState<"type" | "input" | "review">(
    session.selectedType ? "input" : "type"
  );

  const checkInMutation = useMutation({
    mutationFn: async (data: CheckInInput) => {
      const response = await kioskFetch("/attendance/kiosk/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 401 || response.status === 403) logout();

      if (!response.ok) {
        const error = await readResponse(response);
        throw new Error(error.message || "Check-in failed");
      }

      return readResponse(response);
    },
    onSuccess: (data) => {
      if (!data.data?._id) {
        playKioskErrorSound();
        setError("The check-in was received without a confirmation. Please try again.");
        return;
      }
      playKioskSuccessSound();
      setSuccess(`Checked in successfully!`, data.data._id);
    },
    onError: (error: Error) => {
      playKioskErrorSound();
      setError(error.message);
    },
  });

  const handleTypeSelect = (type: "staff" | "visitor") => {
    updateFormData({ type });
    setCurrentStep("input");
  };

  const handleStaffCheckIn = (staffId: string, _staffName: string) => {
    updateFormData({
      type: "staff",
      staffId,
      staffName: _staffName,
      purpose: "Daily work",
    });
    setCurrentStep("review");
  };

  const handleVisitorCheckIn = async (data: {
    visitorName: string;
    visitorEmail?: string;
    visitorPhone?: string;
    purpose: string;
  }) => {
    updateFormData(data);
    setCurrentStep("review");
  };

  const handleSubmit = () => {
    const { type, staffId, visitorName, purpose } = session.formData;

    if (!type || !purpose) {
      playKioskErrorSound();
      setError("Please fill in all required fields");
      return;
    }

    if (type === "staff" && !staffId) {
      playKioskErrorSound();
      setError("Please select a staff member");
      return;
    }

    if (type === "visitor" && !visitorName) {
      playKioskErrorSound();
      setError("Please enter visitor name");
      return;
    }

    const payload: CheckInInput = {
      type: session.formData.type || "visitor",
      staffId: session.formData.staffId,
      visitorName: session.formData.visitorName,
      visitorEmail: session.formData.visitorEmail,
      visitorPhone: session.formData.visitorPhone,
      purpose: session.formData.purpose as string,
      linkedInspectionId: session.formData.linkedInspectionId,
      assignedSalesRep: session.formData.assignedSalesRep,
      notes: session.formData.notes,
    };

    checkInMutation.mutate(payload);
  };

  if (currentStep === "type") {
    return (
      <div className="kiosk-content-width w-full max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
          Who are you?
        </h2>

        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
          <button
            onClick={() => handleTypeSelect("staff")}
            className="w-full p-6 rounded-lg text-lg font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: "#5C4033",
              color: "#FFF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3D2A1F";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#5C4033";
            }}
          >
            I'm Staff
          </button>

          <button
            onClick={() => handleTypeSelect("visitor")}
            className="w-full p-6 rounded-lg text-lg font-semibold transition-all border-2 cursor-pointer"
            style={{
              backgroundColor: "#FFF",
              color: "#5C4033",
              borderColor: "#5C4033",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F5EEE8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFF";
            }}
          >
            I'm a Visitor
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "input") {
    return session.formData.type === "staff" ? (
      <StaffLookupForm onSelect={handleStaffCheckIn} />
    ) : (
      <VisitorForm onSubmit={handleVisitorCheckIn} />
    );
  }

  // Review step
  return (
    <div className="kiosk-content-width w-full max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <CheckCircle2 size={80} style={{ color: "#5C4033", margin: "0 auto" }} />
      </div>

      <h2 className="text-3xl font-bold mb-6" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Review
      </h2>

      <div className="kiosk-review-card mx-auto w-full max-w-xl rounded-lg p-6 mb-6 text-left space-y-3">
        {session.formData.type === "staff" ? (
          <p>
              <strong>Staff Member:</strong> {session.formData.staffName || session.formData.staffId}
          </p>
        ) : (
          <>
            <p>
              <strong>Visitor:</strong> {session.formData.visitorName}
            </p>
            {session.formData.visitorEmail && (
              <p>
                <strong>Email:</strong> {session.formData.visitorEmail}
              </p>
            )}
          </>
        )}
        <p>
          <strong>Purpose:</strong> {session.formData.purpose}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={checkInMutation.isPending}
          className="w-full p-4 rounded-lg font-semibold text-white text-lg"
          style={{
            backgroundColor: checkInMutation.isPending ? "#999" : "#5C4033",
          }}
        >
          {checkInMutation.isPending ? "Checking in..." : "Confirm Check In"}
        </button>

        <button
          onClick={() => setCurrentStep("input")}
          className="w-full p-4 rounded-lg font-semibold border-2"
          style={{
            borderColor: "#5C4033",
            color: "#5C4033",
            backgroundColor: "#FFF",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export const CheckInComponent = CheckInScreen;

function StaffLookupForm({ onSelect }: { onSelect: (staffId: string, name: string) => void }) {
  const { logout } = useKiosk();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ _id: string; firstName: string; lastName: string; department?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await kioskFetch(`/attendance/kiosk/staff-search?q=${encodeURIComponent(query)}`);
      if (response.status === 401 || response.status === 403) logout();
      const data = await response.json();
      setResults(data.data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kiosk-search-screen w-full max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Find Your Name
      </h2>

      <input
        type="text"
        placeholder="Search staff by name or badge..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="kiosk-search-input w-full p-4 rounded-lg border-2 text-lg"
        style={{
          borderColor: "#DDD",
          backgroundColor: "#FFF",
        }}
        autoFocus
      />

      {loading && <div className="text-center mt-4">Searching...</div>}

      <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
        {results.map((staff) => (
          <button
            key={staff._id}
            onClick={() =>
              onSelect(
                staff._id,
                `${staff.firstName} ${staff.lastName}`
              )
            }
            className="w-full p-4 rounded-lg text-left transition-all hover:opacity-80"
            style={{
              backgroundColor: "#F5EEE8",
              color: "#181818",
            }}
          >
            <div className="font-semibold">{staff.firstName} {staff.lastName}</div>
            <div className="text-sm" style={{ color: "#666" }}>
              {staff.department}
            </div>
          </button>
        ))}
      </div>

      {search && results.length === 0 && !loading && (
        <div className="text-center mt-6 text-sm" style={{ color: "#999" }}>
          No staff members found
        </div>
      )}
    </div>
  );
}

function VisitorForm({
  onSubmit,
}: {
  onSubmit: (data: {
    visitorName: string;
    visitorEmail?: string;
    visitorPhone?: string;
    purpose: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("inspect property");

  const handleSubmit = () => {
    if (!name || !purpose) {
      return;
    }

    onSubmit({
      visitorName: name,
      visitorEmail: email || undefined,
      visitorPhone: phone || undefined,
      purpose,
    });
  };

  return (
    <div className="kiosk-content-width w-full max-w-2xl mx-auto px-1 sm:px-4">
      <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Visitor Information
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full p-4 rounded-lg border-2 text-lg"
            style={{ borderColor: "#DDD" }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full p-4 rounded-lg border-2 text-lg"
            style={{ borderColor: "#DDD" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234..."
            className="w-full p-4 rounded-lg border-2 text-lg"
            style={{ borderColor: "#DDD" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Purpose *</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full p-4 rounded-lg border-2 text-lg"
            style={{ borderColor: "#DDD" }}
          >
            <option value="inspect property">Inspect Property</option>
            <option value="meet sales rep">Meet Sales Rep</option>
            <option value="follow-up">Follow-up</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || !purpose}
          className="w-full p-4 rounded-lg font-semibold text-white text-lg mt-6"
          style={{
            backgroundColor: name && purpose ? "#5C4033" : "#CCC",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
