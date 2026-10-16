import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useKiosk } from "./use-kiosk.js";
import { playKioskErrorSound, playKioskSuccessSound } from "./kiosk-feedback";
import { kioskFetch } from "./kiosk-api.js";

async function readResponse(response: Response): Promise<{ message?: string; data?: { _id: string; durationMinutes?: number } }> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { message?: string; data?: { _id: string; durationMinutes?: number } };
  } catch {
    return {};
  }
}

export function CheckOutScreen() {
  const { setSuccess, setError, reset, logout } = useKiosk();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<
    { _id: string; visitorName?: string; checkInTime: string; staffId?: { firstName: string; lastName: string } }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const checkOutMutation = useMutation({
    mutationFn: async (logId: string) => {
      const response = await kioskFetch(`/attendance/kiosk/${logId}/check-out`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });

      if (response.status === 401 || response.status === 403) logout();

      if (!response.ok) {
        const error = await readResponse(response);
        throw new Error(error.message || "Check-out failed");
      }

      return readResponse(response);
    },
    onSuccess: (data) => {
      if (!data.data?._id) {
        playKioskErrorSound();
        setError("The check-out was received without a confirmation. Please try again.");
        return;
      }
      playKioskSuccessSound();
      const duration = data.data.durationMinutes ?? 0;
      setSuccess(`Checked out! Stay time: ${duration} minutes`, data.data._id);
    },
    onError: (error: Error) => {
      playKioskErrorSound();
      setError(error.message);
    },
  });

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search for open logs
      const response = await kioskFetch(`/attendance/kiosk/open-logs?q=${encodeURIComponent(query)}`);
      if (response.status === 401 || response.status === 403) logout();
      const data = await response.json();

      setResults(data.data || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = (logId: string) => {
    checkOutMutation.mutate(logId);
  };

  return (
    <div className="kiosk-search-screen w-full max-w-2xl text-center">
      <div className="mb-6">
        <LogOut size={80} style={{ color: "#5C4033", margin: "0 auto" }} />
      </div>

      <h2 className="text-3xl font-bold mb-6" style={{ color: "#5C4033", fontFamily: "'Manrope', sans-serif" }}>
        Check Out
      </h2>

      <input
        type="text"
        placeholder="Search name or badge..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="kiosk-search-input w-full p-4 rounded-lg border-2 text-lg mb-6"
        style={{
          borderColor: "#DDD",
          backgroundColor: "#FFF",
        }}
        autoFocus
      />

      {loading && <div className="text-center">Searching...</div>}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map((log) => (
          <button
            key={log._id}
            onClick={() => handleCheckOut(log._id)}
            disabled={checkOutMutation.isPending}
            className="w-full p-4 rounded-lg text-left transition-all"
            style={{
              backgroundColor: "#F5EEE8",
              color: "#181818",
              opacity: checkOutMutation.isPending ? 0.5 : 1,
            }}
          >
            <div className="font-semibold">{log.visitorName || `${log.staffId?.firstName} ${log.staffId?.lastName}`}</div>
            <div className="text-sm" style={{ color: "#666" }}>
              Checked in: {new Date(log.checkInTime).toLocaleTimeString()}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        className="w-full mt-6 p-4 rounded-lg font-semibold border-2"
        style={{
          borderColor: "#5C4033",
          color: "#5C4033",
          backgroundColor: "#FFF",
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}
