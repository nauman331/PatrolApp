import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slice/auth-management/authSlice";
import { RootState } from "@/store";
import { LogIn, LogOut } from "lucide-react";
//import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function LoginButton() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  //const navigate = useNavigate();
  const handleLogin = () => {
    //navigate("/login");
    window.location.href = "/login";
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
  };

  return (
    <>
      {auth.isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          title={`Logged in as ${auth.username}`}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 rounded-3xl border border-brand bg-brand/10 px-6 py-3 text-sm font-medium text-brand hover:bg-brand/20 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Login</span>
        </button>
      )}
    </>
  );
}
