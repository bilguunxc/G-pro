import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Бүртгэл амжилтгүй");
        setLoading(false);
        return;
      }

      setSuccess("Бүртгэл амжилттай! Нэвтэрнэ үү.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError("Сервертэй холбогдож чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Бүртгүүлэх
        </h1>

        {error && (
          <div className="p-3 mb-4 text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 text-green-600 bg-green-100 rounded">
            {success}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Email
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Password
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white transition bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center">
          Аль хэдийн бүртгэлтэй юу?{" "}
          <Link
            href="/login"
            className="font-medium text-black hover:underline"
          >
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
