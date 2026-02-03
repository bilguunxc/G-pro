import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCart } from "../store/cartSlice";
import { logout } from "../store/authSlice";
import { resetCart } from "../store/cartSlice";


const BASE_URL = "http://localhost:3000/products";

export default function Home() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, token } = useSelector((state) => state.auth);

  const cartItems = useSelector(
    (state) => state.cart?.items || [] );

  const totalItems = cartItems.reduce(
    (sum, p) => sum + (p.qty || 0), 0 );


  useEffect(() => {
    fetch(BASE_URL)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);


  const deleteProduct = async (id) => {
    if (!window.confirm("Барааг устгах уу?")) return;

    await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Home page</h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/add-product")}
            className="px-4 py-2 text-white bg-green-600 rounded">
            Бараа нэмэх
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="px-4 py-2 text-white bg-blue-600 rounded">
            Сагс ({totalItems})
          </button>

          <button
            onClick={() => {
              dispatch(clearCart());
              dispatch(resetCart());
              dispatch(logout());
            }}
            className="px-4 py-2 bg-gray-200 rounded">
            Logout
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-6">
        {products.map((product) => (
          <li
            key={product.id}
            className="p-4 border rounded cursor-pointer"
            onClick={() =>
              navigate(`/products/${product.id}`)}>
                
            <h3>{product.name}</h3>
            <p>Үнэ: {product.price} ₮</p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch(addToCart(product));
              }}
              className="px-3 py-1 mt-2 text-white bg-green-600 rounded">
              Сагсанд нэмэх
            </button>

            {Number(product.user_id) === Number(user?.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProduct(product.id);
                }}
                className="px-3 py-1 ml-2 text-white bg-red-600 rounded">
                Устгах
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
