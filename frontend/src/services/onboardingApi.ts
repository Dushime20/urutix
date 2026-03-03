import api from './api';

export const onboardingAPI = {
  getStatus: () => api.get('/onboarding/status'),
  updateStep1: (data: any) => api.put('/onboarding/step/1', data),
  updateStep2: (data: any) => api.put('/onboarding/step/2', data),
  updateStep3: (data: any) => api.put('/onboarding/step/3', data),
  updateStep4: (data: any) => api.put('/onboarding/step/4', data),
  complete: () => api.post('/onboarding/complete'),
};
