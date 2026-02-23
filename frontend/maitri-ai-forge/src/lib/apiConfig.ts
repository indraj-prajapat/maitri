const API_ROOT = import.meta.env.VITE_API_ROOT ;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${API_ROOT}/api`;
const SAVE2_BASE_URL = import.meta.env.VITE_SAVE2_BASE_URL || `${API_ROOT}/save2`;

export { API_ROOT, API_BASE_URL, SAVE2_BASE_URL };
