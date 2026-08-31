import api from './api';

export const getWatchlist = () => api.get('/watchlist');

export const addToWatchlist = (symbol) => api.post(`/watchlist/${encodeURIComponent(symbol)}`);

export const removeFromWatchlist = (symbol) => api.delete(`/watchlist/${encodeURIComponent(symbol)}`);