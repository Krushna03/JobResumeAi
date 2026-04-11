import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Runs `action` when the user is signed in; otherwise sends them to login
 * and preserves `location` so they can return after auth.
 */
export function useRequireAuthAction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  return useCallback(
    (action: () => void) => {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Log in or create an account to download and use this feature.",
        });
        navigate("/login", {
          state: { from: `${location.pathname}${location.search}` },
        });
        return;
      }
      action();
    },
    [user, navigate, location.pathname, location.search, toast],
  );
}
