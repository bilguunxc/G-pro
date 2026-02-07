import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {removeFromCart, increaseQty,decreaseQty,} from "../store/cartSlice";

export default function Cart() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  const totalPrice = cart.reduce(
    (sum, p) => sum + p.price * p.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Сагс хоосон байна");
      return;
    }
    router.push("/payment");
  };

  return (
    <div className="flex justify-center min-h-screen p-6 bg-gray-100">
      <div className="w-full max-w-3xl p-8 space-y-4 bg-white shadow rounded-xl">
        <h1 className="text-xl font-bold text-center">
          Сагс
        </h1>

        {cart.length === 0 ? (
          <p className="text-center text-gray-500">
            Сагс хоосон байна
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold truncate">
                    {p.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Number(p.price).toLocaleString()} ₮ × {p.qty}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={p.qty === 1}
                      onClick={() =>
                        dispatch(decreaseQty(p.id))}
                      className="px-3 py-2 transition border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      -
                    </button>

                    <span className="w-10 text-center">
                      {p.qty}
                    </span>

                    <button
                      onClick={() =>
                        dispatch(increaseQty(p.id))}
                      className="px-3 py-2 transition border rounded-lg hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      dispatch(removeFromCart(p.id))}
                    className="px-3 py-2 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 space-y-3 border-t">
          {cart.length > 0 && (
            <>
              <h2 className="text-lg font-semibold">
                Нийт: {totalPrice.toLocaleString()} ₮
              </h2>

              <button
                onClick={handleCheckout}
                className="w-full py-3 text-white transition bg-black rounded-xl hover:bg-gray-800"
              >
                Худалдан авах
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3 transition bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Дэлгүүр рүү
          </button>
        </div>
      </div>
    </div>
  );
}
