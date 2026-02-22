"use client";

import { useState } from "react";
import { type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "~/components/Navbar/Navbar";
import { withPublicRoute } from "~/providers/AuthProvider/withPublicRoute";
import { supabase } from "~/server/supabase/supabaseClient";
import { ChevronDown, ChevronUp, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type RoleName = "admin" | "super_admin" | "manager" | "staff" | "user";

const testAccounts: {
  email: string;
  password: string;
  role: RoleName;
  label: string;
}[] = [
  { email: "random@gmail.com", password: "password", role: "admin", label: "Admin" },
  { email: "ahmed.manager@example.com", password: "password", role: "manager", label: "Manager" },
  { email: "fatima.staff@example.com", password: "password", role: "staff", label: "Staff" },
];

const roleBadgeColors: Record<RoleName, string> = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  admin: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  staff: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  user: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

const Layout = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (account: (typeof testAccounts)[number]) => {
    setSigningIn(account.email);
    setError(null);
    setSuccess(null);
    try {
      const { error: authError } = await supabase().auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (authError) {
        setError(`${account.label}: ${authError.message}`);

        return;
      }

      setSuccess(`Logged in as ${account.label}`);
      router.push("/dashboard");
    } catch (e) {
      setError("Network error. Is Supabase running?");
    } finally {
      setSigningIn(null);
    }
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="relative flex w-full grow flex-col">
        {children}
        {process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" && (
          <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border/60 bg-card/95 shadow-elevated backdrop-blur-md">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">
                    Dev Accounts
                  </span>
                  <p className="text-[10px] text-muted-foreground">Click to sign in instantly</p>
                </div>
              </div>
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expanded && (
              <div className="border-t border-border/40 px-2 py-2">
                {error && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                    <p className="text-[11px] text-destructive">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    <p className="text-[11px] text-green-700 dark:text-green-400">{success}</p>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {testAccounts.map((account) => (
                    <button
                      key={account.email}
                      disabled={!!signingIn}
                      onClick={() => void handleSignIn(account)}
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all hover:bg-primary/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground/80 group-hover:text-foreground">
                          {signingIn === account.email ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Signing in...
                            </span>
                          ) : (
                            account.email
                          )}
                        </p>
                      </div>
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeColors[account.role]}`}
                      >
                        {account.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 px-3 pb-1 text-[10px] text-muted-foreground/60">
                  Password: <span className="font-mono font-medium">password</span> &middot; Requires local Supabase
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default withPublicRoute(Layout);
