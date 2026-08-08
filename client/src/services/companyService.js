import api from './api';

export const searchCompanies = (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );

  return api.get('/companies', { params: cleanParams });
};

export const getCompanyFilterOptions = () => api.get('/companies/filter-options');
