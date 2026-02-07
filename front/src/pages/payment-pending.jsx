import { useDispatch, useSelector } from "react-redux";
import { setPaymentMethod, setPaymentPaid, clearCheckout } from "../store/checkoutSlice";
import { clearCart } from "../store/cartSlice";
import { useRouter } from "next/router";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";

export default function PaymentPending() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { orderId, totalPrice, status, paymentMethod } = useSelector((state) => state.checkout);


  if (!orderId || status !== "pending") {
    return (
      <div className="flex justify-center min-h-screen p-6 bg-gray-100">
        <div className="w-full max-w-3xl p-8 space-y-4 text-center bg-white shadow rounded-xl">
          <p className="text-gray-600">
            Идэвхтэй төлбөр алга
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3 transition bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmPayment = async () => {
    try {
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
        alert(data.message || "Төлбөр баталгаажуулж чадсангүй");
        return;
      }

      dispatch(setPaymentPaid());
      dispatch(clearCart());
      dispatch(clearCheckout());
      alert("Төлбөр амжилттай хийгдлээ");
      router.push("/");
    } catch {
      alert("Сервертэй холбогдож чадсангүй");
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-3xl p-8 space-y-6 bg-white shadow rounded-xl">
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
              {totalPrice.toLocaleString()} ₮
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => dispatch(setPaymentMethod("transfer"))}
            className={`w-full py-3 transition border rounded-xl ${
              paymentMethod === "transfer"
                ? "bg-black text-white border-black"
                : "hover:bg-gray-50"
            }`}
          >
            Шилжүүлгээр төлөх
          </button>

          <button
            onClick={() => dispatch(setPaymentMethod("qpay"))}
            className={`w-full py-3 transition border rounded-xl ${
              paymentMethod === "qpay"
                ? "bg-black text-white border-black"
                : "hover:bg-gray-50"
            }`}
          >
            QPay
          </button>
        </div>


      {paymentMethod === "qpay" && (
        <div className="p-4 space-y-1 border rounded-lg bg-gray-50">
          <p>
            Төлөх дүн:{" "}
            <strong>{totalPrice.toLocaleString()} ₮</strong>
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
            <strong>{totalPrice.toLocaleString()} ₮</strong>
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
              className="w-full py-3 text-white transition bg-black rounded-xl hover:bg-gray-800"
            >
              Төлсөн
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3 transition bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    </div>
  );
}
