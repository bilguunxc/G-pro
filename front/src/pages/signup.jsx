import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const now = new Date();
  const currentYear = now.getFullYear();

  const yearOptions = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, i) => currentYear - i
  );

  const monthOptions = Array.from(
    { length: 12 },
    (_, i) => i + 1
  );

  const daysInSelectedMonth = (() => {
    const y = Number(birthYear);
    const m = Number(birthMonth);
    if (!y || !m) return 31;
    return new Date(y, m, 0).getDate();
  })();

  const dayOptions = Array.from(
    { length: daysInSelectedMonth },
    (_, i) => i + 1
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password,
          birthYear,
          birthMonth,
          birthDay,
        }),
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
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Бүртгүүлэх
        </h1>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 text-green-700 bg-green-100 border border-green-200 rounded-xl">
            {success}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Имэйл</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              placeholder="Ж: bilguun_01"
            />
          </div>

          <div>
            <label className="label">Нууц үг</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Хамгийн багадаа 6 тэмдэгт"
            />
          </div>

          <div>
            <label className="label">Төрсөн огноо</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="select"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                required
              >
                <option value="">Он</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                required
              >
                <option value="">Сар</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                required
              >
                <option value="">Өдөр</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
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
