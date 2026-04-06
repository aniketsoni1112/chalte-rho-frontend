import { createContext, useState, useEffect } from "react";
import { registerPush } from "../utils/registerPush";
import socket from "./SocketContext";

const AuthContext = createContext();

// Extract clean string userId from any user object shape
const extractId = (user) => {
  if (!user) return null;
  const raw = user._id || user.id;
  if (!raw) return null;
  if (typeof raw === "object" && raw.$oid) return raw.$oid;
  return String(raw);
};

const connectSocket = (user) => {
  const userId = extractId(user);
  if (!userId) return;
  if (!socket.connected) socket.connect();
  // Register immediately if already connected, else wait for connect event
  const register = () => socket.emit("register", { userId, role: user.role || "user" });
  if (socket.connected) register();
  else socket.once("connect", register);
};

const normalizeUser = (user) => {
  if (!user) return user;
  // Normalize legacy role:rider -> role:user
  if (user.role === "rider") return { ...user, role: "user" };
  return user;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = normalizeUser(JSON.parse(saved));
        if (parsed?.role) {
          // Re-save normalized user back to localStorage
          localStorage.setItem("user", JSON.stringify(parsed));
          setUser(parsed);
          connectSocket(parsed);
          registerPush();
        } else {
          localStorage.clear();
        }
      }
    } catch {
      localStorage.clear();
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    const user = normalizeUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    connectSocket(user);
    registerPush();
  };

  const logout = () => {
    // Disconnect socket cleanly before clearing session
    socket.disconnect();
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };