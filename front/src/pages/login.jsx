import { useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/router";
import { loginSuccess } from "../store/authSlice";
import { setCartUser } from "../store/cartSlice";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";

export default function Login() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Нэвтрэх
        </h1>

        {error && (
          <div className="p-3 mb-4 text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-3 border rounded"
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value,
              })}
          />

          <input
            type="password"
            className="w-full p-3 border rounded"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })}
          />

          <button
            disabled={loading}
            className="w-full py-2 text-white bg-black rounded"
          >
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Бүртгэлгүй юу?{" "}
          <Link href="/signup" className="underline">
            Бүртгүүлэх
          </Link>
        </p>
      </div>
    </div>
  );
}
