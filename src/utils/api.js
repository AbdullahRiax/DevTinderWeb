import axios from "axios";

export const BASE_URL = "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const getErrorMessage = (err, fallback = "Something went wrong.") => {
  if (!err.response) {
    return "Unable to reach the server. Please try again later.";
  }
  const data = err.response.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.errors === "string") return data.errors;
  if (data?.errors && typeof data.errors === "object") {
    return Object.values(data.errors).join(" ");
  }
  return data?.message || data?.error || fallback;
};

export const sanitizeUser = ({ password: _password, ...user }) => user;

export const fetchProfile = async () => {
  const res = await api.get("/profile/view");
  return sanitizeUser(res.data);
};

export default api;
