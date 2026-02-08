import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  removeFromCart,
  increaseQty,
  decreaseQty,
} from "../store/cartSlice";
import { setCheckoutItems } from "../store/checkoutSlice";

export default function Cart() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items);

  const totalPrice = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return sum + price * qty;
  }, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Сагс хоосон байна");
      return;
    }
    dispatch(
      setCheckoutItems({
        items: cart,
        source: "cart",
      })
    );
    router.push("/payment");
  };

  return (
    <div className="flex justify-center min-h-screen p-4 sm:p-6">
      <div className="card w-full max-w-3xl space-y-4 p-6 sm:p-8">
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
                  {p.store_name && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Дэлгүүр:{" "}
                      <span className="font-medium text-gray-700">
                        {p.store_name}
                      </span>
                    </p>
                  )}
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
                      className="btn btn-secondary px-3 py-2 disabled:opacity-40"
                    >
                      -
                    </button>

                    <span className="w-10 text-center">
                      {p.qty}
                    </span>

                    <button
                      onClick={() =>
                        dispatch(increaseQty(p.id))}
                      className="btn btn-secondary px-3 py-2"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      dispatch(removeFromCart(p.id))}
                    className="btn btn-danger px-3 py-2"
                  >
                    Устгах
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
                className="btn btn-primary w-full py-3"
              >
                Худалдан авах
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="btn btn-secondary w-full py-3"
          >
            Дэлгүүр рүү
          </button>
        </div>
      </div>
    </div>
  );
}
