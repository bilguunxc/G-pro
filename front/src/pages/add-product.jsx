import { useState } from "react";
import { useRouter } from "next/router";

export default function AddProduct() {
  const router = useRouter();

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

      // Trigger a one-time client refresh so the Home list shows the newly added item immediately.
      router.push("/?refresh=1");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={submit}
        className="w-full max-w-md p-8 space-y-4 bg-white shadow rounded-xl"
      >
        <h1 className="text-xl font-bold text-center">
          Бараа нэмэх
        </h1>

        {error && (
          <div className="p-3 text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <input
          name="productName"
          value={form.productName}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Барааны нэр"
        />

        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Үнэ"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Тайлбар"
        />

        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Зургийн URL"
        />

        <button
          disabled={loading}
          className="w-full py-3 text-white transition bg-black rounded-xl hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Нэмж байна..." : "Нэмэх"}
        </button>
      </form>
    </div>
  );
}
