import api from './api';

export const getPortfolio = () => api.get('/portfolio');

export const getTransactions = () => api.get('/portfolio/transactions');
