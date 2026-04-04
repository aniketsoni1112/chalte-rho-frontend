import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const FAQS = [
  { q: "My payment is missing", a: "Check your wallet balance. If still missing, raise a ticket with the ride ID and our team will resolve within 24 hours." },
  { q: "App is not showing ride requests", a: "Ensure you are Online and location permission is granted. Try restarting the app." },
  { q: "How do I report a customer?", a: "After completing the ride, use 'Report Issue' and select 'Customer Behavior'." },
  { q: "How is my rating calculated?", a: "Your rating is the average of all customer ratings over the last 100 trips." },
  { q: "When will my incentive be credited?", a: "Incentives are credited within 24 hours of completing the challenge." },
];

const ISSUES = ["Missing Payment", "App Issue", "Customer Behavior", "Wrong Deduction", "Incentive Not Credited", "Other"];

export default function CaptainSupport() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("faq");
  const [openFaq, setOpenFaq] = useState(null);
  const [issue, setIssue] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!issue || !desc) return alert("Select issue and describe it");
    setLoading(true);
    try { await API.post("/user/support", { issue, description: desc }); } catch {}
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white text-xl font-bold">←</button>
        <h1 className="text-white font-black text-xl">❓ Help & Support</h1>
      </div>

      <div className="flex mx-4 mt-4 bg-white rounded-2xl p-1 shadow-sm">
        {["faq", "report"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? "bg-gray-900 text-white" : "text-gray-400"}`}>
            {t === "faq" ? "❓ FAQ" : "🚨 Report Issue"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === "faq" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[{ icon: "💸", label: "Payment" }, { icon: "📱", label: "App Issue" }, { icon: "📞", label: "Call Us" }].map((a) => (
                <button key={a.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                  <p className="text-2xl">{a.icon}</p>
                  <p className="text-gray-700 font-semibold text-xs mt-1">{a.label}</p>
                </button>
              ))}
            </div>
            {FAQS.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <span className="font-semibold text-gray-800 text-sm">{f.q}</span>
                  <span className="text-gray-400 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-gray-500 text-sm border-t border-gray-50 pt-2">{f.a}</div>}
              </div>
            ))}
          </>
        )}

        {tab === "report" && !submitted && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {ISSUES.map((iss) => (
                <button key={iss} onClick={() => setIssue(iss)}
                  className={`py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${issue === iss ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-100 bg-white text-gray-600"}`}>
                  {iss}
                </button>
              ))}
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
              className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl p-3 outline-none text-sm resize-none"
              placeholder="Describe your issue in detail..." />
            <button onClick={submit} disabled={loading}
              className="w-full bg-yellow-500 text-white font-black py-4 rounded-2xl text-lg disabled:opacity-60">
              {loading ? "Submitting..." : "Submit Ticket →"}
            </button>
          </div>
        )}

        {tab === "report" && submitted && (
          <div className="text-center py-12 space-y-3">
            <p className="text-5xl">✅</p>
            <h2 className="font-black text-xl text-gray-800">Ticket Submitted!</h2>
            <p className="text-gray-500 text-sm">We'll resolve your issue within 24 hours.</p>
            <button onClick={() => { setSubmitted(false); setIssue(""); setDesc(""); }}
              className="bg-yellow-500 text-white font-bold px-6 py-2 rounded-xl">New Ticket</button>
          </div>
        )}
      </div>
    </div>
  );
}
