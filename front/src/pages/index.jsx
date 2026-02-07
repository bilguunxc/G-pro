import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { addToCart, clearCart, resetCart } from "../store/cartSlice";
import { logout } from "../store/authSlice";

const CLIENT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api";

const BASE_URL = `${CLIENT_API_BASE_URL}/products`;

export default function Home({
  initialProducts = [],
  initialError = "",
}) {
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState(initialError);
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const cartItems = useSelector((state) => state.cart?.items || []);

  const totalItems = cartItems.reduce(
    (sum, p) => sum + (p.qty || 0),
    0
  );

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.refresh !== "1") return;

    const ac = new AbortController();

    (async () => {
      try {
        setError("");
        const res = await fetch(BASE_URL, {
          signal: ac.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Алдаа гарлаа");
        }

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Алдаа гарлаа");
      } finally {
        router.replace("/", undefined, { shallow: true });
      }
    })();

    return () => ac.abort();
  }, [router.isReady, router.query.refresh]);

  const deleteProduct = async (id) => {
    if (!window.confirm("Барааг устгах уу?")) return;

    await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    setProducts((prev) =>
      prev.filter((p) => p.id !== id)
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="mx-auto max-w-7xl">

        <div className="p-8 mb-8 bg-white shadow rounded-xl">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-2xl font-bold">
              Барааны жагсаалт
            </h1>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/add-product")}
                className="px-4 py-2.5 text-white transition bg-black rounded-xl hover:bg-gray-800"
              >
                + Бараа нэмэх
              </button>

              <button
                onClick={() => router.push("/cart")}
                className="px-4 py-2.5 transition bg-gray-200 rounded-xl hover:bg-gray-300"
              >
                Сагс ({totalItems})
              </button>

              <button
                onClick={async () => {
                  try {
                    await fetch(`${CLIENT_API_BASE_URL}/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch {
                    // ignore
                  } finally {
                    dispatch(clearCart());
                    dispatch(resetCart());
                    dispatch(logout());
                    router.push("/login");
                  }
                }}
                className="px-4 py-2.5 transition bg-gray-200 rounded-xl hover:bg-gray-300">
                Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() =>
                router.push(`/products/${product.id}`)
              }
              className="overflow-hidden transition bg-white border cursor-pointer rounded-xl hover:shadow">
              <div className="h-48 overflow-hidden bg-gray-200">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="mb-2 text-lg font-semibold">
                  {product.name}
                </h3>

                <p className="mb-3 font-semibold">
                  {Number(product.price).toLocaleString()} ₮
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(addToCart(product));
                    }}
                    className="flex-1 px-3 py-2 text-sm text-white transition bg-black rounded-xl hover:bg-gray-800"
                  >
                    Сагсанд нэмэх
                  </button>

                  {Number(product.user_id) ===
                    Number(user?.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(product.id);
                      }}
                      className="px-3 py-2 text-sm text-white transition bg-red-600 rounded-xl hover:bg-red-700"
                    >
                      Устгах
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="mt-10 text-center text-gray-500">
            Одоогоор бараа байхгүй байна
          </div>
        )}
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const apiOrigin =
    process.env.API_ORIGIN ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${apiOrigin}/products`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Алдаа гарлаа");
    }

    return {
      props: {
        initialProducts: Array.isArray(data) ? data : [],
        initialError: "",
      },
      revalidate: 60,
    };
  } catch (err) {
    // Don't fail the build if the API is down.
    return {
      props: {
        initialProducts: [],
        initialError: err?.message || "Алдаа гарлаа",
      },
      revalidate: 30,
    };
  }
}
