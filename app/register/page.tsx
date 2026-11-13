"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to create account.");
      return;
    }

    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">Start watching on QuatuBe.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-red-500"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="font-medium text-red-400 hover:text-red-300">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
