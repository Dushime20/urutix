import axios from 'axios';

export async function checkVerificationStatus(type: string, payload: any) {
  const response = await axios.post(`/api/onboarding/verify/${type}`, payload);
  return response.data;
}
