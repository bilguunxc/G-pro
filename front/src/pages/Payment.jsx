import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setPaymentPending } from "../store/checkoutSlice";

export default function Payment() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart.items);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

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
    if (Object.values(form).some((hooson) => !hooson)) {
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
      const res = await fetch("http://localhost:3000/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

      dispatch(setPaymentPending({
          orderId: data.orderId,
          totalPrice: data.totalPrice,
        })
      );

      navigate("/payment-pending");
    } catch (err) {
      console.error("Payment error:", err);
      alert("Сервертэй холбогдож чадсангүй");
    }
  };

  return (
    <div className="max-w-xl p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Төлбөр төлөх</h1>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">
          Захиалсан бараа
        </h2>

        {cart.map((item) => (
          <div
            key={item.id}
            className="flex justify-between p-3 mb-2 border rounded">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                {item.qty} ×{" "}
                {item.price.toLocaleString()} ₮
              </p>
            </div>

            <p className="font-semibold">
              {(item.price * item.qty).toLocaleString()} ₮
            </p>
          </div>
        ))}

        <p className="pt-3 mt-3 text-lg font-bold border-t">
          Нийт төлөх дүн:{" "}
          {totalPrice.toLocaleString()} ₮
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Утасны дугаар"
          className="w-full p-2 border rounded"
        />

        <input
          name="province"
          value={form.province}
          onChange={handleChange}
          placeholder="Аймаг / Хот"
          className="w-full p-2 border rounded"
        />

        <input
          name="district"
          value={form.district}
          onChange={handleChange}
          placeholder="Сум / Дүүрэг"
          className="w-full p-2 border rounded"
        />

        <input
          name="khoroo"
          value={form.khoroo}
          onChange={handleChange}
          placeholder="Хороо"
          className="w-full p-2 border rounded"
        />

        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Дэлгэрэнгүй хаяг"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 text-white bg-green-600 rounded hover:bg-green-700">
        Төлбөр төлөх
      </button>
    </div>
  );
}
