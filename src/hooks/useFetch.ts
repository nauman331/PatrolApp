import { useEffect, useState } from 'react';
import apiClient, { ApiResponse } from '../services/api-client';

export function useFetch<T = any>(url: string, deps: any[] = []) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await apiClient.get<ApiResponse<T>>(url);
                if (!mounted) return;
                if (res.data?.success) {
                    setData(res.data.data ?? null);
                } else {
                    setError(res.data?.message ?? 'Unknown error');
                }
            } catch (err: any) {
                setError(err?.message ?? 'Network error');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error };
}
