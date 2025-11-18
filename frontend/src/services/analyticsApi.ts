import axios from 'axios';

export async function trackOnboardingStep(step: string, data: any) {
  return axios.post('/api/analytics/onboarding-step', { step, ...data });
}
