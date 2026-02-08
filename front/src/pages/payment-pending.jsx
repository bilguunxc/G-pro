import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setPaymentMethod,
  setPaymentPaid,
  clearCheckout,
} from "../store/checkoutSlice";
import { clearCart } from "../store/cartSlice";
import { useRouter } from "next/router";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export default function PaymentPending() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { orderId, totalPrice, status, paymentMethod, source } = useSelector((state) => state.checkout);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  if (!orderId || status !== "pending") {
    return (
      <div className="flex justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-3xl space-y-4 p-6 text-center sm:p-8">
          <p className="text-gray-600">
            Идэвхтэй төлбөр алга
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn btn-secondary w-full py-3"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmPayment = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/payment-pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          method: paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Төлбөр баталгаажуулж чадсангүй");
        return;
      }

      dispatch(setPaymentPaid());
      if (source === "cart") {
        dispatch(clearCart());
      }
      dispatch(clearCheckout());
      alert("Төлбөр амжилттай хийгдлээ");
      router.push("/");
    } catch {
      setError("Сервертэй холбогдож чадсангүй");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-4 sm:p-6">
      <div className="card w-full max-w-3xl space-y-6 p-6 sm:p-8">
        <h1 className="text-xl font-bold text-center">
          Төлбөр баталгаажуулах
        </h1>

        <div className="space-y-3">
          <p className="text-lg">
            Захиалга № <b>{orderId}</b>
          </p>

          <div className="p-4 border rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">
              Нийт төлөх дүн
            </p>
            <p className="text-2xl font-bold">
              {Number(totalPrice).toLocaleString()} ₮
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => dispatch(setPaymentMethod("transfer"))}
            className={`btn w-full border py-3 ${
              paymentMethod === "transfer"
                ? "btn-primary border-black"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            Шилжүүлгээр төлөх
          </button>

          <button
            onClick={() => dispatch(setPaymentMethod("qpay"))}
            className={`btn w-full border py-3 ${
              paymentMethod === "qpay"
                ? "btn-primary border-black"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            QPay
          </button>
        </div>


      {paymentMethod === "qpay" && (
        <div className="p-4 space-y-1 border rounded-lg bg-gray-50">
          <p>
            Төлөх дүн:{" "}
            <strong>{Number(totalPrice).toLocaleString()} ₮</strong>
          </p>
          <p>
            Гүйлгээний утга:{" "}
            <strong>ORDER-{orderId}</strong>
          </p>
        </div>
      )}

      {paymentMethod === "transfer" && (
        <div className="p-4 space-y-1 border rounded-lg bg-gray-50">
          <p>
            Данс: <strong>4905123456</strong>
          </p>
          <p>
            Эзэмшигч: <strong>Билгүүн</strong>
          </p>
          <p>
            Мөнгөн дүн:{" "}
            <strong>{Number(totalPrice).toLocaleString()} ₮</strong>
          </p>
          <p>
            Гүйлгээний утга:{" "}
            <strong>ORDER-{orderId}</strong>
          </p>
        </div>
      )}

        <div className="space-y-3">
          {paymentMethod && (
            <button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? "Шалгаж байна..." : "Төлсөн"}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn btn-secondary w-full py-3"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    </div>
  );
}
