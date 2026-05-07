import { createContext, useState, useEffect } from "react";
import { registerPush } from "../utils/registerPush";
import socket from "./SocketContext";
import axios from "axios";
import { BASE_URL } from "../services/api";

const AuthContext = createContext();

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
  const register = () => socket.emit("register", { userId, role: user.role || "user" });
  if (socket.connected) register();
  else socket.once("connect", register);
};

const normalizeUser = (user) => {
  if (!user) return user;
  if (user.role === "rider") return { ...user, role: "user" };
  return user;
};

// Fetch fresh profile — works for all roles via JWT
const refreshUserFromServer = async (token) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: token },
    });
    return normalizeUser(data);
  } catch (err) {
    // 401 = token expired/invalid — clear session
    if (err?.response?.status === 401) {
      localStorage.clear();
    }
    return null;
  }
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const saved = localStorage.getItem("user");
        if (token && saved) {
          const cached = normalizeUser(JSON.parse(saved));
          if (cached?.role) {
            // Set cached user first so loading=false doesn't flash redirect
            setUser(cached);
            connectSocket(cached);
          }
          // Refresh from server in background
          const fresh = await refreshUserFromServer(token);
          if (fresh) {
            localStorage.setItem("user", JSON.stringify(fresh));
            setUser(fresh);
            connectSocket(fresh);
            registerPush();
          } else if (!cached?.role) {
            // No cached user and refresh failed — clear
            localStorage.clear();
          }
        }
      } catch {
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = (data) => {
    const u = normalizeUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    connectSocket(u);
    registerPush();
  };

  const logout = () => {
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