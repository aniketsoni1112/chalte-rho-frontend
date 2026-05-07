import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const STATUS_COLORS = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("captains");
  const [captains, setCaptains] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteMap, setNoteMap] = useState({});

  useEffect(() => {
    API.get("/manager/stats").then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "captains") fetchCaptains();
    if (tab === "history") fetchHistory();
  }, [tab, statusFilter]);

  const fetchCaptains = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/manager/captains?status=${statusFilter}&search=${search}`);
      setCaptains(data);
    } catch { } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/manager/captains/history");
      setHistory(data);
    } catch { } finally { setLoading(false); }
  };

  const approve = async (id, status) => {
    try {
      const { data } = await API.patch(`/manager/captains/${id}/approve`, {
        status,
        note: noteMap[id] || "",
      });
      setCaptains(p => p.map(c => c._id === id ? data : c));
      if (stats) setStats(prev => ({
        ...prev,
        pending: prev.pending - 1,
        [status]: prev[status] + 1,
      }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white text-xl">←</button>
          <div>
            <h1 className="text-white font-black text-lg">🛡️ Manager Dashboard</h1>
            <p className="text-gray-400 text-xs">Captain Approval System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-bold">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 px-4 py-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-800" },
            { label: "Pending", value: stats.pending, color: "bg-yellow-500" },
            { label: "Approved", value: stats.approved, color: "bg-green-500" },
            { label: "Rejected", value: stats.rejected, color: "bg-red-500" },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center text-white`}>
              <p className="font-black text-xl">{s.value}</p>
              <p className="text-white/80 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-2">
        {[
          { id: "captains", label: "👤 Captains" },
          { id: "history",  label: "📋 History" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.id ? "bg-gray-900 text-white" : "bg-white text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6 space-y-3">

        {/* ── CAPTAINS TAB ── */}
        {tab === "captains" && (
          <>
            {/* Filters */}
            <div className="flex gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchCaptains()}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                placeholder="Search name, email, license..." />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-2 py-2 text-sm outline-none bg-white">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loading && <p className="text-center text-gray-400 py-6">Loading...</p>}

            {!loading && captains.length === 0 && (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">🏍️</p>
                <p className="text-gray-500 font-semibold">No captains found</p>
              </div>
            )}

            {captains.map(c => (
              <div key={c._id} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                {/* Captain Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow">
                      {c.name?.[0] || "C"}
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{c.name}</p>
                      <p className="text-gray-400 text-xs">{c.email || c.phone}</p>
                      <p className="text-gray-400 text-xs">Joined: {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[c.captainStatus] || "bg-gray-100 text-gray-500"}`}>
                    {c.captainStatus || "pending"}
                  </span>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-black text-gray-600 mb-2">📄 Documents</p>
                  {[
                    { label: "Vehicle Type", value: c.vehicle },
                    { label: "Vehicle Number", value: c.vehicleNumber },
                    { label: "RC Card Number", value: c.rcCardNumber },
                    { label: "License Number", value: c.licenseNumber },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{d.label}</span>
                      <span className={`text-xs font-bold ${d.value ? "text-gray-800" : "text-red-400"}`}>
                        {d.value || "Not provided"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Approval note */}
                {c.captainStatus === "pending" && (
                  <input
                    value={noteMap[c._id] || ""}
                    onChange={e => setNoteMap(p => ({ ...p, [c._id]: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="Add approval note (optional)..."
                  />
                )}

                {/* Already approved/rejected info */}
                {c.captainStatus !== "pending" && c.approvedBy && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">
                      {c.captainStatus === "approved" ? "✅ Approved" : "❌ Rejected"} by{" "}
                      <span className="font-bold text-gray-700">{c.approvedBy?.name}</span>
                      {" "}on {new Date(c.approvedAt).toLocaleDateString()}
                    </p>
                    {c.approvalNote && <p className="text-xs text-gray-500 mt-1">Note: {c.approvalNote}</p>}
                  </div>
                )}

                {/* Action Buttons */}
                {c.captainStatus === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(c._id, "approved")}
                      className="flex-1 bg-green-500 text-white font-black py-3 rounded-xl text-sm">
                      ✅ Approve
                    </button>
                    <button onClick={() => approve(c._id, "rejected")}
                      className="flex-1 bg-red-500 text-white font-black py-3 rounded-xl text-sm">
                      ❌ Reject
                    </button>
                  </div>
                )}

                {/* Re-evaluate already processed */}
                {c.captainStatus !== "pending" && (
                  <button onClick={() => approve(c._id, c.captainStatus === "approved" ? "rejected" : "approved")}
                    className={`w-full py-2 rounded-xl text-xs font-bold border-2 ${c.captainStatus === "approved" ? "border-red-200 text-red-500" : "border-green-200 text-green-600"}`}>
                    {c.captainStatus === "approved" ? "Revoke Approval" : "Re-Approve"}
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <>
            {loading && <p className="text-center text-gray-400 py-6">Loading...</p>}
            {!loading && history.length === 0 && (
              <div className="text-center py-10">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-gray-500 font-semibold">No approval history yet</p>
              </div>
            )}
            {history.map(c => (
              <div key={c._id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-black text-gray-800">{c.name}</p>
                    <p className="text-gray-400 text-xs">{c.email || c.phone}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[c.captainStatus]}`}>
                    {c.captainStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>🏍️ {c.vehicle} • {c.vehicleNumber || "N/A"}</p>
                  <p>📄 License: {c.licenseNumber || "N/A"}</p>
                  <p>👤 By: <span className="font-bold text-gray-700">{c.approvedBy?.name || "N/A"}</span></p>
                  <p>📅 {c.approvedAt ? new Date(c.approvedAt).toLocaleString() : "N/A"}</p>
                  {c.approvalNote && <p>📝 {c.approvalNote}</p>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
