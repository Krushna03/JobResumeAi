import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/hooks/use-toast";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Signup() {
  const { register, loginWithGoogleIdToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(username, email, password);
      toast({ title: "Account created" });
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleSuccess(res: CredentialResponse) {
    if (!res.credential) return;
    setSubmitting(true);
    try {
      await loginWithGoogleIdToken(res.credential);
      toast({ title: "Signed in with Google" });
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Google sign-in failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <AppLogo size="lg" className="mb-10 w-full justify-center" />

        <Card className="rounded-2xl border border-border bg-card/90 p-8 shadow-none backdrop-blur-sm">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" state={{ from }} className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Name</Label>
              <Input
                id="username"
                autoComplete="name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl bg-background/50"
              />
              <p className="text-xs text-muted-foreground">At least 6 characters.</p>
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl border-0 font-medium gradient-primary text-white hover:opacity-90"
              disabled={submitting}
            >
              {submitting ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {googleClientId ? (
            <div className="flex justify-center [&>div]:!w-full">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() =>
                  toast({
                    title: "Google sign-in error",
                    variant: "destructive",
                  })
                }
                useOneTap={false}
              />
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Set VITE_GOOGLE_CLIENT_ID in your env to enable Google sign-in.
            </p>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
