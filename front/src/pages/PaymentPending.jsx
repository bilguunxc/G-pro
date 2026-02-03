import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setPaymentMethod, setPaymentPaid, clearCheckout } from "../store/checkoutSlice";
import { clearCart } from "../store/cartSlice";

export default function PaymentPending() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const { orderId, totalPrice, status, paymentMethod } = useSelector((state) => state.checkout);


  if (!orderId || status !== "pending") {
    return (
      <div className="max-w-xl p-6 mx-auto text-center">
        <p className="text-gray-500">
          Идэвхтэй төлбөр алга</p>
      </div>
    );
  }

  const handleConfirmPayment = async () => {
    try {
      const res = await fetch("http://localhost:3000/payment-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      navigate("/");
    } catch {
      alert("Сервертэй холбогдож чадсангүй");
    }
  };

  return (
    <div className="max-w-xl p-6 mx-auto">
      <h1 className="mb-2 text-2xl font-bold text-green-700">
        Төлбөр баталгаажуулах
      </h1>

      <p className="mb-6 text-lg">
        Захиалга № <b>{orderId}</b>
      </p>

      <div className="p-4 mb-6 border rounded bg-green-50">
        <p className="text-lg font-semibold">
          Нийт төлөх дүн:
        </p>
        <p className="text-2xl font-bold text-green-700">
          {totalPrice.toLocaleString()} ₮
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => dispatch(setPaymentMethod("transfer"))}
          className={`w-full py-3 rounded border ${
            paymentMethod === "transfer"
              ? "bg-green-600 text-white border-green-600"
              : "hover:bg-green-50"
          }`}>
          Шилжүүлгээр төлөх
        </button>

        <button
          onClick={() => dispatch(setPaymentMethod("qpay"))}
          className={`w-full py-3 rounded border ${
            paymentMethod === "qpay"
              ? "bg-green-600 text-white border-green-600"
              : "hover:bg-green-50"
          }`}>
          QPay
        </button>
      </div>


      {paymentMethod === "qpay" && (
        <div className="p-4 mt-6 space-y-1 border rounded bg-gray-50">
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
        <div className="p-4 mt-6 space-y-1 border rounded bg-gray-50">
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

      {paymentMethod && (
        <button
          onClick={handleConfirmPayment}
          className="w-full py-3 mt-6 text-white bg-green-600 rounded hover:bg-green-700">
          Төлсөн
        </button>
      )}
    </div>
  );
}
