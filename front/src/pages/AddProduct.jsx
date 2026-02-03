import { useState } from "react";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const submit = (e) => {
    e.preventDefault();
    alert("Product added");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={submit}
        className="w-full max-w-md p-8 space-y-4 bg-white shadow rounded-xl">
        <h1 className="text-xl font-bold text-center">Бараа нэмэх</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Нэр"/>

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg"
          placeholder="Үнэ"/>

        <button className="w-full py-3 text-white bg-black rounded-xl">
          Нэмэх
        </button>
      </form>
    </div>
  );
}
