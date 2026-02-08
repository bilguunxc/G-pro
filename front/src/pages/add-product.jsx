import { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";

export default function AddProduct() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const storeName =
    user?.store_name || user?.username || "";
  const storeAddress =
    user?.store_address || "";
  const hasStoreAddress = storeAddress.trim().length > 0;

  const [form, setForm] = useState({
    productName: "",
    price: "",
    description: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!hasStoreAddress) {
      setError("Эхлээд Профайл хэсгээс дэлгүүрийн хаягаа бүртгэнэ үү");
      return;
    }

    if (!form.productName || !form.price) {
      setError("Нэр болон үнийг бөглөнө үү");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "/api";

      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Алдаа гарлаа");
      }

      router.push("/?refresh=1");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
      <form
        onSubmit={submit}
        className="card w-full max-w-md p-6 space-y-4 sm:p-8"
      >
        <h1 className="text-xl font-bold text-center">
          Бараа нэмэх
        </h1>

        <div className="p-4 border rounded-xl bg-gray-50">
          <p className="text-sm text-gray-600">
            Дэлгүүр
          </p>
          <p className="font-semibold">
            {storeName || "—"}
          </p>
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
            {storeAddress
              ? storeAddress
              : "Профайл хэсгээс дэлгүүрийн хаягаа оруулна уу"}
          </p>
          {!hasStoreAddress && (
            <button
              type="button"
              onClick={() => router.push("/account")}
              className="btn btn-primary mt-3 w-full"
            >
              Профайл руу очих
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <input
          name="productName"
          value={form.productName}
          onChange={handleChange}
          className="input"
          placeholder="Барааны нэр"
          required
          maxLength={80}
        />

        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          className="input"
          placeholder="Үнэ"
          required
          min={0}
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="textarea"
          placeholder="Тайлбар"
          rows={4}
          maxLength={500}
        />

        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          className="input"
          placeholder="Зургийн URL"
        />

        <button
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Нэмж байна..." : "Нэмэх"}
        </button>
      </form>
    </div>
  );
}
