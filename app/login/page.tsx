"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RunwayLogo } from "@/components/RunwayLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, isConfigured } = useAuth();
  const router = useRouter();

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-light dark:bg-background-dark">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <RunwayLogo className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold">Runway</h1>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 max-w-md text-center">
          <p className="font-semibold text-amber-800 dark:text-amber-200">Firebase not configured</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
            Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> with
            NEXT_PUBLIC_FIREBASE_* variables. See .env.example.
          </p>
          <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-light dark:bg-background-dark">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <RunwayLogo className="size-6" />
        </div>
        <h1 className="text-xl font-extrabold text-[#111418] dark:text-white">Runway</h1>
      </Link>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">Sign in</h2>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-lg py-3 font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-gray-500">
          No account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
