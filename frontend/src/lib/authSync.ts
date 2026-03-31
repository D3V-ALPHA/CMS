import { useAuthStore } from '@/stores/authStore';
import { setAuthToken } from './api';

// Subscribe to store changes
const store = useAuthStore.getState();
let currentToken = store.accessToken;
setAuthToken(currentToken);

useAuthStore.subscribe((state) => {
  if (state.accessToken !== currentToken) {
    currentToken = state.accessToken;
    setAuthToken(currentToken);
  }
});