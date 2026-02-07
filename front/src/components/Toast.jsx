export default function Toast({ message, type }) {
  const colors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className={`text-white px-4 py-2 rounded mb-2 shadow ${colors[type]}`}>
      {message}
    </div>
  );
}
