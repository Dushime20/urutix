import axios from 'axios';

export async function submitCompanyInfo(data: any) {
  return axios.post('/api/onboarding/company', data);
}

export async function submitAdminUser(data: any) {
  return axios.post('/api/onboarding/admin', data);
}

export async function submitPayment(data: any) {
  return axios.post('/api/onboarding/payment', data);
}

export async function submitBranding(data: any) {
  return axios.post('/api/onboarding/branding', data);
}

export async function inviteUsers(data: any) {
  return axios.post('/api/onboarding/invite-users', data);
}
