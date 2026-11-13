"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Access your QuatuBe account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <button type="submit" className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-500">
            Sign in
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          No account? <Link href="/register" className="font-medium text-red-400 hover:text-red-300">Create one</Link>
        </div>
      </div>
    </main>
  );
}
