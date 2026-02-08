import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import { setCartUser } from "../store/cartSlice";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function Admin() {
  const router = useRouter();
  const dispatch = useDispatch();
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

  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [productQuery, setProductQuery] = useState("");
  const [productsLoading, setProductsLoading] =
    useState(false);
  const [productsError, setProductsError] =
    useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const ac = new AbortController();
    setProductsLoading(true);
    setProductsError("");

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/products`,
          {
            credentials: "include",
            signal: ac.signal,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || "Алдаа гарлаа"
          );
        }

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setProductsError(err?.message || "Алдаа гарлаа");
      } finally {
        setProductsLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isAdmin]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const id = String(p?.id ?? "");
      const name = String(p?.name ?? "").toLowerCase();
      const ownerEmail = String(p?.owner_email ?? "").toLowerCase();
      const ownerUsername = String(
        p?.owner_username ?? ""
      ).toLowerCase();

      return (
        id.includes(q) ||
        name.includes(q) ||
        ownerEmail.includes(q) ||
        ownerUsername.includes(q)
      );
    });
  }, [products, productQuery]);

  const removeProduct = async (id) => {
    const ok = window.confirm(
      "Энэ барааг устгах уу?"
    );
    if (!ok) return;

    setDeletingId(id);
    setProductsError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/products/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || "Устгах үед алдаа гарлаа"
        );
      }

      setProducts((prev) =>
        prev.filter((p) => p.id !== id)
      );
    } catch (err) {
      setProductsError(err?.message || "Алдаа гарлаа");
    } finally {
      setDeletingId(null);
    }
  };

  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [usersLoading, setUsersLoading] =
    useState(false);
  const [usersError, setUsersError] = useState("");
  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  useEffect(() => {
    if (!isAdmin) return;

    const ac = new AbortController();
    setUsersLoading(true);
    setUsersError("");

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/admin/users`,
          {
            credentials: "include",
            signal: ac.signal,
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || "Алдаа гарлаа"
          );
        }

        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setUsersError(err?.message || "Алдаа гарлаа");
      } finally {
        setUsersLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const id = String(u?.id ?? "");
      const email = String(u?.email ?? "").toLowerCase();
      const username = String(u?.username ?? "").toLowerCase();
      const role = String(u?.role ?? "").toLowerCase();

      return (
        id.includes(q) ||
        email.includes(q) ||
        username.includes(q) ||
        role.includes(q)
      );
    });
  }, [users, userQuery]);

  const setUserRole = async (id, role) => {
    const isSelf = Number(id) === Number(user?.id);
    const ok = window.confirm(
      isSelf
        ? "Та өөрийн эрхээ өөрчлөх гэж байна. Үргэлжлүүлэх үү?"
        : "Хэрэглэгчийн эрх өөрчлөх үү?"
    );
    if (!ok) return;

    setUpdatingUserId(id);
    setUsersError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/users/${id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ role }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Эрх өөрчлөх үед алдаа гарлаа"
        );
      }

      const updatedUser = data?.user;
      if (updatedUser?.id) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updatedUser.id ? updatedUser : u
          )
        );
      }
    } catch (err) {
      setUsersError(err?.message || "Алдаа гарлаа");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-lg p-6 text-center sm:p-8">
          <p className="text-gray-600">
            Ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-lg p-6 sm:p-8">
          <h1 className="text-xl font-bold">
            Admin хэсэг
          </h1>
          <p className="mt-2 text-gray-600">
            Энэ хуудсыг үзэхэд admin эрх
            шаардлагатай.
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn btn-secondary mt-6 w-full py-3"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card mb-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">
                Admin panel
              </h1>
              <p className="mt-1 text-sm text-gray-600 truncate">
                {user?.email || user?.username}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="btn btn-secondary"
              >
                ← Нүүр
              </button>
            </div>
          </div>

          <div className="mt-6">
            <input
              value={productQuery}
              onChange={(e) =>
                setProductQuery(e.target.value)
              }
              placeholder="ID / нэр / эзэмшигчээр хайх..."
              className="input"
            />
          </div>
        </div>

        {productsError && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {productsError}
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    ID
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Бараа
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Үнэ
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Эзэмшигч
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Ачаалж байна...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Бараа олдсонгүй
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t"
                    >
                      <td className="px-4 py-3">
                        {p.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {Number(p.price).toLocaleString()} ₮
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-800">
                          {p.owner_username ||
                            "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.owner_email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            removeProduct(p.id)
                          }
                          disabled={
                            deletingId === p.id
                          }
                          className="btn btn-danger px-3 py-2"
                        >
                          {deletingId === p.id
                            ? "Устгаж байна..."
                            : "Устгах"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mt-10 p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Хэрэглэгчийн эрх
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Admin эрх олгосон хэрэглэгч refresh хийсний
                дараа admin боломжууд идэвхжинэ.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="ID / email / username / role хайх..."
              className="input"
            />
          </div>

          {usersError && (
            <div className="p-4 mt-6 text-red-700 bg-red-100 border border-red-200 rounded-xl">
              {usersError}
            </div>
          )}

          <div className="mt-6 overflow-hidden border rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      ID
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Email
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Username
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Role
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Ачаалж байна...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Хэрэглэгч олдсонгүй
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const role = String(u?.role || "user");
                      const nextRole =
                        role === "admin" ? "user" : "admin";
                      const isSelf =
                        Number(u?.id) === Number(user?.id);

                      return (
                        <tr
                          key={u.id}
                          className="border-t"
                        >
                          <td className="px-4 py-3">
                            {u.id}
                          </td>
                          <td className="px-4 py-3">
                            {u.email || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {u.username || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                role === "admin"
                                  ? "px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded"
                                  : "px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded"
                              }
                            >
                              {role}
                            </span>
                            {isSelf && (
                              <span className="ml-2 text-xs text-gray-500">
                                (та)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                setUserRole(u.id, nextRole)
                              }
                              disabled={updatingUserId === u.id}
                              className={
                                nextRole === "admin"
                                  ? "btn btn-primary px-3 py-2"
                                  : "btn px-3 py-2 bg-gray-700 text-white hover:bg-gray-800"
                              }
                            >
                              {updatingUserId === u.id
                                ? "Өөрчилж байна..."
                                : nextRole === "admin"
                                  ? "Admin болгох"
                                  : "User болгох"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
