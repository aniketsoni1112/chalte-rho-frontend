// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5007/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;

// import axios from "axios";

// const API = axios.create({
//   // ✅ Sirf HTTPS wala link dalo, arrows aur baaki kachra hata do
//   baseURL: "https://unconsummately-merocrine-tashia.ngrok-free.app/api",

//   headers: {
//     "Content-Type": "application/json",
//     "ngrok-skip-browser-warning": "true",
//   },
// });

// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// export default API;