import axios from "axios";

const TUNNEL_URL = "https://pointed-fourth-writings-producer.trycloudflare.com";

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
