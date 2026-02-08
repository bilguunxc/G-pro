import { useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { loginSuccess } from "../store/authSlice";
import { setCartUser } from "../store/cartSlice";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function Login() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [form, setForm] = useState({
    loginId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      dispatch(loginSuccess({ user: data.user }));
      dispatch(setCartUser(data.user.id));

      const nextPath =
        typeof router.query.next === "string"
          ? router.query.next
          : "/";
      router.push(nextPath);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Нэвтрэх
        </h1>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Имэйл эсвэл Username</label>
            <input
              className="input"
              placeholder="Ж: bataa_01 эсвэл email@example.com"
              autoComplete="username"
              value={form.loginId}
              onChange={(e) =>
                setForm({
                  ...form,
                  loginId: e.target.value,
                })}
              required
            />
          </div>

          <div>
            <label className="label">Нууц үг</label>
            <input
              type="password"
              className="input"
              placeholder="Нууц үгээ оруулна уу"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })}
              required
            />
          </div>

          <button
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Бүртгэлгүй юу?{" "}
          <Link
            href="/signup"
            className="font-medium text-black hover:underline"
          >
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}
