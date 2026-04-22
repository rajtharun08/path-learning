import { Platform } from 'react-native';

// For Web: use localhost if running on the same machine.
// For Mobile: use your machine's local IP (e.g., 192.168.x.x).
const BASE_IP = 'localhost'; 

export const API_URLS = {
  PLAYLIST_SERVICE: `http://${BASE_IP}:8002`,
  PATH_SERVICE: `http://${BASE_IP}:8006`,
  VIDEO_SERVICE: `http://${BASE_IP}:8003`,
};

export const USER_ID = '5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859';
