import axios from "axios";

const TUNNEL_URL = "http://192.168.1.8:5008";

const API = axios.create({
  baseURL: `${TUNNEL_URL}/api`,
  headers: {},
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;
export { TUNNEL_URL };
