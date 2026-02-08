import { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setPaymentPending } from "../store/checkoutSlice";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function Payment() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);
  const checkout = useSelector((state) => state.checkout);

  const checkoutItems = Array.isArray(checkout?.items)
    ? checkout.items
    : [];

  const activeItems =
    checkoutItems.length > 0 ? checkoutItems : cart;
  const source =
    checkoutItems.length > 0
      ? checkout?.source || "direct"
      : "cart";

  const totalPrice = activeItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return sum + price * qty;
  }, 0);

  const [form, setForm] = useState({
    phone: "",
    province: "",
    district: "",
    khoroo: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.values(form).some((v) => !String(v || "").trim())) {
      setError("Мэдээллээ бүрэн бөглөнө үү");
      return;
    }

    if (activeItems.length === 0) {
      setError("Сагс хоосон байна");
      return;
    }

    const items = activeItems.map((item) => ({
      productId: item.id,
      quantity: item.qty,
    }));

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Алдаа гарлаа");
        return;
      }

      dispatch(
        setPaymentPending({
          orderId: data.orderId,
          totalPrice: data.totalPrice,
        })
      );

      router.push("/payment-pending");
    } catch (err) {
      console.error("Payment error:", err);
      setError("Сервертэй холбогдож чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-4 sm:p-6">
      <div className="card w-full max-w-3xl space-y-6 p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold">
            Төлбөр төлөх
          </h1>
          {source === "direct" && (
            <p className="mt-1 text-sm text-gray-600">
              Шууд худалдан авалт
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Захиалсан бараа
          </h2>

          {activeItems.length === 0 ? (
            <p className="text-gray-500">
              Сагс хоосон байна
            </p>
          ) : (
            <div className="space-y-3">
              {activeItems.map((item) => (
                <div key={item.id}
                  className="flex flex-col justify-between gap-2 p-4 border rounded-lg sm:flex-row">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.name}
                    </p>
                    {item.store_name && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Дэлгүүр:{" "}
                        <span className="font-medium text-gray-700">
                          {item.store_name}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {item.qty} × {Number(item.price).toLocaleString()} ₮
                    </p>
                  </div>

                  <p className="font-semibold">
                    {(Number(item.price) * Number(item.qty)).toLocaleString()} ₮
                  </p>
                </div>
              ))}

              <p className="pt-3 text-lg font-bold border-t">
                Нийт төлөх дүн: {totalPrice.toLocaleString()} ₮
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Утасны дугаар"
            className="input"
            autoComplete="tel"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="province"
              value={form.province}
              onChange={handleChange}
              placeholder="Аймаг / Хот"
              className="input"
              autoComplete="address-level1"
            />

            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="Сум / Дүүрэг"
              className="input"
              autoComplete="address-level2"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="khoroo"
              value={form.khoroo}
              onChange={handleChange}
              placeholder="Хороо"
              className="input"
              autoComplete="address-level3"
            />

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Дэлгэрэнгүй хаяг"
              className="input"
              autoComplete="street-address"
            />
          </div>

          <div className="space-y-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? "Илгээж байна..." : "Төлбөр төлөх"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(source === "cart" ? "/cart" : "/")
              }
              className="btn btn-secondary w-full py-3"
            >
              {source === "cart"
                ? "Сагс руу буцах"
                : "Дэлгүүр рүү буцах"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
