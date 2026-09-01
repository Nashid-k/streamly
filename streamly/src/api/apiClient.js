import axios from "axios";

// Using production URL directly for React Native MVP
const API_URL = "https://streamly-backend-9q7i.onrender.com/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});
