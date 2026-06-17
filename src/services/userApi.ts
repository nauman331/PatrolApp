import apiClient, { ApiResponse } from './api-client';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  security_license_no: string;
  email_verified_at: string | null;
  user_type: string;
  email_verification_token: string | null;
  is_email_verified: boolean | null;
  status: number;
  otp: string | null;
  otp_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  phone: string;
  security_license_no: string;
  status: number;
}

function extractMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export async function fetchUserProfile(userId: string | number) {
  try {
    const res = await apiClient.get<ApiResponse<UserProfile>>(`/edit-user/${userId}`);
    if (res.data?.success && res.data.data) {
      return { success: true as const, data: res.data.data };
    }
    return {
      success: false as const,
      message: res.data?.message ?? 'Failed to load profile',
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err, 'Network error') };
  }
}

export async function updateUserProfile(
  userId: string | number,
  payload: UpdateUserPayload,
) {
  try {
    const res = await apiClient.put<ApiResponse<UserProfile>>(
      `/update-user/${userId}`,
      payload,
    );
    if (res.data?.success && res.data.data) {
      return {
        success: true as const,
        data: res.data.data,
        message: res.data.message ?? 'User updated successfully',
      };
    }
    return {
      success: false as const,
      message: res.data?.message ?? 'Failed to update profile',
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err, 'Network error') };
  }
}

export async function deleteUserAccount(userId: string | number) {
  try {
    const res = await apiClient.delete<ApiResponse<null>>(`/delete-user/${userId}`);
    if (res.data?.success) {
      return {
        success: true as const,
        message: res.data.message ?? 'Account deleted successfully',
      };
    }
    return {
      success: false as const,
      message: res.data?.message ?? 'Failed to delete account',
    };
  } catch (err) {
    return { success: false as const, message: extractMessage(err, 'Network error') };
  }
}
