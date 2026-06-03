import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

/**
 * Hook to protect routes from unauthenticated access.
 * Redirects to login if not authenticated.
 */
export function useAuthProtection() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated;
}
