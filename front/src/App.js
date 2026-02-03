import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import AddProduct from "./pages/AddProduct";
import ProductDetail from "./pages/ProductDetail";
import Payment from "./pages/Payment";
import PaymentPending from "./pages/PaymentPending";
import Cart from "./pages/cart";

import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./pages/NotificationContainer";
import ProtectedRoute from "./routes/Route";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/payment-pending" element={<ProtectedRoute><PaymentPending /></ProtectedRoute>} />

          {/* 🔓 Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>

        <NotificationContainer />
      </NotificationProvider>
    </BrowserRouter>
  );
}
