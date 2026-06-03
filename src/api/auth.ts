import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const response = await axios.post(`${API_BASE_URL}/login`, payload);
  const { data } = response.data;
  return {
    token: data.token,
    user: {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.user_type,
    },
  };
}
