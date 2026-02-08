import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { addToCart } from "../../store/cartSlice";
import { setCheckoutItems } from "../../store/checkoutSlice";
import { useNotification } from "../../context/NotificationContext";

export default function ProductDetail({
  product = null,
  error = "",
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { notify } = useNotification();
  const [qty, setQty] = useState(1);

  const safeQty = Number.isFinite(Number(qty))
    ? Math.max(1, Math.min(99, Math.floor(Number(qty))))
    : 1;

  if (router.isFallback) {
    return (
      <div className="flex justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-5xl p-6 sm:p-8">
          <p className="text-center text-gray-600">
            Ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center min-h-screen p-4 sm:p-6">
        <div className="card w-full max-w-5xl space-y-4 p-6 text-center sm:p-8">
          <p className="text-gray-700">
            Бараа олдсонгүй
          </p>
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
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
    );
  }

  const total = Number(product.price) * safeQty;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Барааны дэлгэрэнгүй мэдээлэл
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              ← Буцах
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="btn btn-primary"
            >
              Сагс
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full aspect-square"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400 aspect-square">
                  No Image
                </div>
              )}
            </div>

            <div className="p-6 space-y-6 sm:p-8">
              <div>
                <p className="text-sm text-gray-500">Үнэ</p>
                <p className="text-3xl font-bold">
                  {Number(product.price).toLocaleString()} ₮
                </p>
              </div>

              <div className="p-5 border rounded-xl bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Тоо ширхэг
                  </p>

                  <div className="flex items-center overflow-hidden bg-white border rounded-xl">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, safeQty - 1))}
                      disabled={safeQty <= 1}
                      className="px-4 py-2 transition hover:bg-gray-50 disabled:opacity-40"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={safeQty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-16 py-2 text-center outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setQty(Math.min(99, safeQty + 1))}
                      disabled={safeQty >= 99}
                      className="px-4 py-2 transition hover:bg-gray-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <p className="text-sm text-gray-600">Нийт</p>
                  <p className="text-lg font-bold">
                    {Number(total).toLocaleString()} ₮
                  </p>
                </div>

                <div className="grid gap-2 mt-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(
                        addToCart({
                          ...product,
                          qty: safeQty,
                        })
                      );
                      notify("Сагсанд нэмлээ", "success");
                    }}
                    className="btn btn-secondary w-full py-3"
                  >
                    Сагсанд нэмэх
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dispatch(
                        setCheckoutItems({
                          source: "direct",
                          items: [
                            {
                              ...product,
                              qty: safeQty,
                            },
                          ],
                        })
                      );
                      router.push("/payment");
                    }}
                    className="btn btn-primary w-full py-3"
                  >
                    Шууд авах
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm font-semibold">
                  Дэлгүүрийн мэдээлэл
                </p>
                <p className="mt-2 text-gray-800">
                  {product.store_name || "—"}
                </p>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                  {product.store_address
                    ? product.store_address
                    : "Хаяг оруулаагүй"}
                </p>
              </div>

              <div className="pt-6 border-t">
                <p className="text-sm font-semibold">
                  Тайлбар
                </p>
                <p className="mt-2 leading-7 text-gray-700 whitespace-pre-line">
                  {product.description || "Тайлбар алга"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const id = params?.id;
  const apiOrigin =
    process.env.API_ORIGIN ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${apiOrigin}/products/${id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Алдаа гарлаа");
    }

    return {
      props: {
        product: data,
        error: "",
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: {
        product: null,
        error: err?.message || "Алдаа гарлаа",
      },
      revalidate: 30,
    };
  }
}
