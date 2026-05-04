import { Platform } from 'react-native';

// For Web: use localhost if running on the same machine.
// For Mobile: use your machine's local IP (e.g., 192.168.x.x).
const BASE_IP = Platform.OS === 'web' ? 'localhost' : '10.150.89.71'; 

export const API_URLS = {
  USER_SERVICE: `http://${BASE_IP}:8001`,
  PLAYLIST_SERVICE: `http://${BASE_IP}:8002`,
  PATH_SERVICE: `http://${BASE_IP}:8006`,
  VIDEO_SERVICE: `http://${BASE_IP}:8003`,
};
