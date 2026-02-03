import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3000/products";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${BASE_URL}/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return <p>Ачаалж байна...</p>;
  if (!product) return <p>Бараа олдсонгүй</p>;

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={() => navigate(-1)}>← Буцах</button>

      <h1>{product.name}</h1>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          width="300"
          style={{ display: "block", margin: "20px 0" }}
        />
      )}

      <p><strong>Үнэ:</strong> {product.price}</p>
      <p><strong>Тайлбар:</strong> {product.description}</p>
    </div>
  );
}
