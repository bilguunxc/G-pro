import { useRouter } from "next/router";

export default function ProductDetail({ product = null, error = ""}) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="flex justify-center min-h-screen p-6 bg-gray-100">
        <div className="w-full max-w-5xl p-8 bg-white shadow rounded-xl">
          <p className="text-center text-gray-600">
            Ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center min-h-screen p-6 bg-gray-100">
        <div className="w-full max-w-5xl p-8 space-y-4 text-center bg-white shadow rounded-xl">
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
            className="w-full py-3 transition bg-gray-200 rounded-xl hover:bg-gray-300"
          >
            Нүүр хуудас
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
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
              className="px-4 py-2.5 transition bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              ← Буцах
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="px-4 py-2.5 text-white transition bg-black rounded-xl hover:bg-gray-800"
            >
              Сагс
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-white shadow rounded-xl">
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

            <div className="p-8 space-y-6">
              <div>
                <p className="text-sm text-gray-500">
                  Үнэ
                </p>
                <p className="text-3xl font-bold">
                  {Number(product.price).toLocaleString()} ₮
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
