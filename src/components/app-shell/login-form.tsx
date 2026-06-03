import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "@/store/slice/auth-management/authSlice";
import { AppDispatch } from "@/store";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    const result = await dispatch(login({ email, password }));
    setIsLoading(false);

    if (login.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name || "User"}!`);
      onSuccess();
      setEmail("");
      setPassword("");
    } else {
      toast.error((result.payload as string) || "Invalid email or password");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-2xl border border-hairline bg-white px-4 py-3 text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-hairline bg-white px-4 py-3 text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
          />
        </div>

        {/* ← removed the handleAutoFill button that was crashing here */}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brand-glow py-3 font-medium text-brand-foreground hover:shadow-lg disabled:opacity-50"
        >
          <LogIn className="h-5 w-5" />
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}