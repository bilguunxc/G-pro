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
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0 );

  const [form, setForm] = useState({
    phone: "",
    province: "",
    district: "",
    khoroo: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((utga) => ({
      ...utga,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (Object.values(form).some((empty) => !empty)) {
      alert("Мэдээллээ бүрэн бөглөнө үү");
      return;
    }

    if (cart.length === 0) {
      alert("Сагс хоосон байна");
      return;
    }

    const items = cart.map((item) => ({
      productId: item.id,
      quantity: item.qty,
    }));

    try {
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
        alert(data.message || "Алдаа гарлаа");
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
      alert("Сервертэй холбогдож чадсангүй");
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-white shadow rounded-xl">
        <h1 className="text-xl font-bold text-center">
          Төлбөр төлөх
        </h1>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Захиалсан бараа
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-500">
              Сагс хоосон байна
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id}
                  className="flex flex-col justify-between gap-2 p-4 border rounded-lg sm:flex-row">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.qty} × {item.price.toLocaleString()} ₮
                    </p>
                  </div>

                  <p className="font-semibold">
                    {(item.price * item.qty).toLocaleString()} ₮
                  </p>
                </div>
              ))}

              <p className="pt-3 text-lg font-bold border-t">
                Нийт төлөх дүн: {totalPrice.toLocaleString()} ₮
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Утасны дугаар"
            className="w-full px-4 py-3 border rounded-lg"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="province"
              value={form.province}
              onChange={handleChange}
              placeholder="Аймаг / Хот"
              className="w-full px-4 py-3 border rounded-lg"
            />

            <input
              name="district"
              value={form.district}
              onChange={handleChange}
              placeholder="Сум / Дүүрэг"
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="khoroo"
              value={form.khoroo}
              onChange={handleChange}
              placeholder="Хороо"
              className="w-full px-4 py-3 border rounded-lg"
            />

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Дэлгэрэнгүй хаяг"
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            className="w-full py-3 text-white transition bg-black rounded-xl hover:bg-gray-800"
          >
            Төлбөр төлөх
          </button>

          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="w-full py-3 transition bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Сагс руу буцах
          </button>
        </div>
      </div>
    </div>
  );
}
