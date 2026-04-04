import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Bike, MapPin, Mic, MicOff, Send, X, MessageCircle } from "lucide-react";
import API from "../services/api";
import socket from "../context/SocketContext";
import { AuthContext } from "../context/AuthContext";

const QUICK_REPLIES = [
  "Book a bike 🏍️",
  "Fare estimate 💰",
  "Where is my captain? 📍",
  "Cancel my ride ❌",
  "Payment help 💳",
];

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-1">Rapido Dost is thinking</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function Message({ m }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
          <Bike size={14} className="text-gray-900" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? "bg-yellow-400 text-gray-900 rounded-br-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
        }`}
      >
        {m.text}
        {m.meta?.fare && (
          <p className="text-xs mt-1 font-semibold text-green-600">💰 Fare: ₹{m.meta.fare}</p>
        )}
        {m.meta?.otp && (
          <p className="text-xs mt-1 font-semibold text-blue-600">🔑 OTP: {m.meta.otp}</p>
        )}
        {m.meta?.captainLocation && (
          <p className="text-xs mt-1 text-blue-500">
            📍 ({m.meta.captainLocation.lat?.toFixed(4)}, {m.meta.captainLocation.lng?.toFixed(4)})
          </p>
        )}
        {m.meta?.captain?.phone && (
          <p className="text-xs mt-1 text-gray-500">📞 {m.meta.captain.phone}</p>
        )}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const { user } = useContext(AuthContext);
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [recording, setRecording] = useState(false);
  const [pickup, setPickup]     = useState(null);
  const bottomRef = useRef(null);
  const recRef    = useRef(null);
  const inputRef  = useRef(null);

  // Load history + join socket room
  useEffect(() => {
    if (!open || !user) return;
    const uid = user._id || user.id;
    socket.emit("join_user_room", uid);

    API.get("/chat/history")
      .then(({ data }) =>
        setMessages(data.map((m) => ({ role: m.role, text: m.message, meta: m.meta })))
      )
      .catch(() => {});

    const onBotMsg = ({ message, meta }) =>
      setMessages((prev) => [...prev, { role: "bot", text: message, meta }]);

    socket.on("bot_message", onBotMsg);
    return () => socket.off("bot_message", onBotMsg);
  }, [open, user]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const addMsg = (role, text, meta = {}) =>
    setMessages((prev) => [...prev, { role, text, meta }]);

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    addMsg("user", msg);
    setInput("");
    setLoading(true);
    try {
      const { data } = await API.post("/chat", { message: msg, pickup });
      addMsg("bot", data.reply, data.meta);
    } catch (err) {
      const errMsg = err.response?.data?.reply || "⚠️ Something went wrong. Try again.";
      addMsg("bot", errMsg);
    }
    setLoading(false);
  };

  // Voice input via Web Speech API
  const handleInputChange = useCallback((e) => setInput(e.target.value), []);
  const handleKeyDown = useCallback((e) => e.key === "Enter" && send(), [input, loading]);
  const handleToggleOpen = useCallback(() => setOpen((o) => !o), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleSendClick = useCallback(() => send(), [input, loading]);

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported in this browser.");

    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "hi-IN"; // supports Hindi + English
    rec.interimResults = false;
    rec.onresult = (e) => send(e.results[0][0].transcript);
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };

  // Share GPS location as pickup
  const shareLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setPickup(loc);
        addMsg("user", `📍 My location: (${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)})`);
        addMsg("bot", "📌 Got your pickup location! Now tell me your destination.");
      },
      () => alert("Could not get your location.")
    );
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={handleToggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-yellow-400 shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        title="Rapido Dost AI"
      >
        <MessageCircle size={26} className="text-gray-900" />
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-80 sm:w-96 h-[560px] bg-gray-50 rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-yellow-400 px-4 py-3 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                <Bike size={16} className="text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight">Rapido Dost AI 🤖</p>
                <p className="text-xs text-gray-700">Book • Track • Support</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-800 hover:text-gray-900 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Message List ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-xs mt-10 px-4">
                <Bike size={32} className="mx-auto mb-2 text-yellow-400" />
                <p className="font-medium text-gray-600">Namaste! Main hoon Rapido Dost 👋</p>
                <p className="mt-1">Book rides, check fares, track your captain & more.</p>
              </div>
            )}
            {messages.map((m, i) => <Message key={i} m={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick Replies ── */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-white border-t border-gray-100 scrollbar-hide">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className="text-xs whitespace-nowrap bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-full px-3 py-1 hover:bg-yellow-100 transition disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* ── Input Bar ── */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-200">
            <button
              onClick={shareLocation}
              className="text-gray-500 hover:text-yellow-500 transition flex-shrink-0"
              title="Share my location"
            >
              <MapPin size={20} className={pickup ? "text-yellow-500" : ""} />
            </button>

            <button
              onClick={toggleVoice}
              className={`flex-shrink-0 transition ${recording ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-yellow-500"}`}
              title="Voice input"
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input
              ref={inputRef}
              className="flex-1 text-sm border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-yellow-400 bg-gray-50"
              placeholder="Type in Hindi or English..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSendClick}
              disabled={loading || !input.trim()}
              className="bg-yellow-400 text-gray-900 rounded-full w-8 h-8 flex items-center justify-center hover:bg-yellow-500 transition disabled:opacity-40 flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
