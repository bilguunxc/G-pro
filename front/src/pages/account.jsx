import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { loginSuccess } from "../store/authSlice";
import { setCartUser } from "../store/cartSlice";
import { useNotification } from "../context/NotificationContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function splitBirthDate(birthDate) {
  if (!birthDate) {
    return { birthYear: "", birthMonth: "", birthDay: "" };
  }

  const s = String(birthDate);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!match) {
    return { birthYear: "", birthMonth: "", birthDay: "" };
  }

  return {
    birthYear: match[1],
    birthMonth: String(Number(match[2])),
    birthDay: String(Number(match[3])),
  };
}

export default function Account() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { notify } = useNotification();
  const user = useSelector((state) => state.auth.user);

  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include",
          signal: ac.signal,
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data?.user) {
          dispatch(loginSuccess({ user: data.user }));
          dispatch(setCartUser(data.user.id));
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
      } finally {
        setCheckingSession(false);
      }
    })();

    return () => ac.abort();
  }, [dispatch]);

  const now = new Date();
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(() => {
    return Array.from(
      { length: currentYear - 1900 + 1 },
      (_, i) => currentYear - i
    );
  }, [currentYear]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  const [profile, setProfile] = useState({
    storeName: "",
    storeAddress: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
  });

  const [profileLoading, setProfileLoading] =
    useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!user) return;

    const birth = splitBirthDate(user.birth_date);
    setProfile({
      storeName: user.store_name || user.username || "",
      storeAddress: user.store_address || "",
      birthYear: birth.birthYear,
      birthMonth: birth.birthMonth,
      birthDay: birth.birthDay,
    });
  }, [user]);

  const daysInSelectedMonth = (() => {
    const y = Number(profile.birthYear);
    const m = Number(profile.birthMonth);
    if (!y || !m) return 31;
    return new Date(y, m, 0).getDate();
  })();

  const dayOptions = useMemo(() => {
    return Array.from(
      { length: daysInSelectedMonth },
      (_, i) => i + 1
    );
  }, [daysInSelectedMonth]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    if (!profile.storeName.trim()) {
      setProfileError("Дэлгүүрийн нэрээ оруулна уу");
      return;
    }

    if (!profile.storeAddress.trim()) {
      setProfileError("Дэлгүүрийн хаягаа оруулна уу");
      return;
    }

    try {
      setProfileLoading(true);

      const res = await fetch(`${API_BASE_URL}/account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Алдаа гарлаа");
      }

      if (data?.user) {
        dispatch(loginSuccess({ user: data.user }));
        dispatch(setCartUser(data.user.id));
      }

      notify("Мэдээлэл хадгалагдлаа", "success");
    } catch (err) {
      const msg = err?.message || "Алдаа гарлаа";
      setProfileError(msg);
      notify(msg, "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError("");

    if (!pw.currentPassword) {
      setPwError("Одоогийн нууц үгээ оруулна уу");
      return;
    }

    if (!pw.newPassword || pw.newPassword.length < 6) {
      setPwError("Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байна");
      return;
    }

    if (pw.newPassword !== pw.confirmPassword) {
      setPwError("Шинэ нууц үг таарахгүй байна");
      return;
    }

    try {
      setPwLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/account/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword: pw.currentPassword,
            newPassword: pw.newPassword,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Алдаа гарлаа");
      }

      setPw({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      notify("Нууц үг солигдлоо", "success");
    } catch (err) {
      const msg = err?.message || "Алдаа гарлаа";
      setPwError(msg);
      notify(msg, "error");
    } finally {
      setPwLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-lg p-6 text-center sm:p-8">
          <p className="text-gray-600">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-lg p-6 sm:p-8">
          <h1 className="text-xl font-bold">Профайл</h1>
          <p className="mt-2 text-gray-600">
            Нэвтэрч байж үргэлжлүүлнэ үү.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="btn btn-primary mt-6 w-full py-3"
          >
            Нэвтрэх
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="card mb-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Профайл</h1>
              <p className="mt-1 text-sm text-gray-600 truncate">
                {user.email} · {user.username}{" "}
                {user.role === "admin" ? "(admin)" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn btn-secondary"
            >
              ← Нүүр
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={saveProfile}
            className="card p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold">
              Дэлгүүрийн мэдээлэл
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Бараа нэмэхийн өмнө дэлгүүрийн хаяг заавал байна.
            </p>

            {profileError && (
              <div className="p-4 mt-5 text-red-700 bg-red-100 border border-red-200 rounded-xl">
                {profileError}
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Дэлгүүрийн нэр
                </label>
                <input
                  value={profile.storeName}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      storeName: e.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Ж: Bilguun Store"
                  maxLength={80}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Дэлгүүрийн хаяг
                </label>
                <textarea
                  value={profile.storeAddress}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      storeAddress: e.target.value,
                    }))
                  }
                  className="textarea"
                  placeholder="Ж: УБ хот, СБД, ... байр ..."
                  rows={4}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Төрсөн огноо
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="select"
                    value={profile.birthYear}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        birthYear: e.target.value,
                      }))
                    }
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
                    value={profile.birthMonth}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        birthMonth: e.target.value,
                        birthDay: "",
                      }))
                    }
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
                    value={profile.birthDay}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        birthDay: e.target.value,
                      }))
                    }
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
            </div>

            <button
              disabled={profileLoading}
              className="btn btn-primary mt-6 w-full py-3"
            >
              {profileLoading ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </form>

          <form
            onSubmit={changePassword}
            className="card p-6 sm:p-8"
          >
            <h2 className="text-lg font-semibold">
              Нууц үг солих
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байна.
            </p>

            {pwError && (
              <div className="p-4 mt-5 text-red-700 bg-red-100 border border-red-200 rounded-xl">
                {pwError}
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Одоогийн нууц үг
                </label>
                <input
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) =>
                    setPw((p) => ({
                      ...p,
                      currentPassword: e.target.value,
                    }))
                  }
                  className="input"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Шинэ нууц үг
                </label>
                <input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) =>
                    setPw((p) => ({
                      ...p,
                      newPassword: e.target.value,
                    }))
                  }
                  className="input"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Шинэ нууц үг (давтах)
                </label>
                <input
                  type="password"
                  value={pw.confirmPassword}
                  onChange={(e) =>
                    setPw((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              disabled={pwLoading}
              className="btn btn-primary mt-6 w-full py-3"
            >
              {pwLoading ? "Сольж байна..." : "Нууц үг солих"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
