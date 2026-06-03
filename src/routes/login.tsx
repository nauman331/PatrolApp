import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useEffect } from "react";
import { LoginForm } from "@/components/app-shell/login-form";
import "@/styles/Login.css";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md rounded-3xl border border-hairline bg-white p-10 shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-glow shadow-xl">
            <svg width="28" height="28" viewBox="0 0 42 42" fill="none">
              <path d="M21 3L5 10v11c0 9.4 6.8 18.2 16 20 9.2-1.8 16-10.6 16-20V10L21 3z" fill="#fff" fillOpacity="0.95" />
              <path d="M15 21l4 4 8-8" stroke="var(--brand)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">Shwanix</h1>
            <p className="text-[10px] font-semibold tracking-[2px] text-brand">GUARD • MANAGER PRO</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-ink mb-1">Welcome back</h2>
        <p className="text-sm text-ink-muted mb-6">Sign in to your account to continue</p>

        <LoginForm onSuccess={() => navigate({ to: "/dashboard" })} />
      </div>
    </div>
  );
}