import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {removeFromCart, increaseQty,decreaseQty,} from "../store/cartSlice";

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  const totalPrice = cart.reduce(
    (sum, p) => sum + p.price * p.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Сагс хоосон байна");
      return;
    }
    navigate("/payment");
  };

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Сагс</h1>

      {cart.length === 0 && (
        <p className="text-gray-500">
          Сагс хоосон байна
        </p>
      )}

      {cart.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between mb-4">
          <div>
            <b>{p.name}</b>
            <p className="text-sm text-gray-600">
              {p.price} ₮ × {p.qty}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              disabled={p.qty === 1}
              onClick={() => dispatch(decreaseQty(p.id))}
              className="px-2 border rounded disabled:opacity-40">
              -
            </button>

            <button
              onClick={() => dispatch(increaseQty(p.id))}
              className="px-2 border rounded">
              +
            </button>

            <button
              onClick={() => dispatch(removeFromCart(p.id))}
              className="px-2 text-white bg-red-500 rounded">
              Remove
            </button>
          </div>
        </div>
      ))}

      <h2 className="mt-4 text-lg font-semibold">
        Нийт: {totalPrice.toLocaleString()} ₮
      </h2>

      <button
        onClick={handleCheckout}
        className="px-4 py-2 mt-4 text-white bg-green-600 rounded">
        Худалдан авах
      </button>
    </div>
  );
}
