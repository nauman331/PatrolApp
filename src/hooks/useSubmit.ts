import { useState } from 'react';
import apiClient, { ApiResponse } from '../services/api-client';

export function useSubmit<T = any, B = any>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (url: string, body?: B, method: 'post' | 'put' | 'patch' | 'delete' = 'post') => {
        setLoading(true);
        setError(null);

        try {
            let res;
            if (method === 'post') res = await apiClient.post<ApiResponse<T>>(url, body);
            if (method === 'put') res = await apiClient.put<ApiResponse<T>>(url, body);
            if (method === 'patch') res = await apiClient.patch<ApiResponse<T>>(url, body);
            if (method === 'delete') res = await apiClient.delete<ApiResponse<T>>(url);

            if (res?.data?.success) {
                return { data: res.data.data, ok: true } as const;
            }

            setError(res?.data?.message ?? 'Unknown error');
            return { data: null, ok: false } as const;
        } catch (err: any) {
            setError(err?.message ?? 'Network error');
            return { data: null, ok: false } as const;
        } finally {
            setLoading(false);
        }
    };

    return { submit, loading, error };
}
