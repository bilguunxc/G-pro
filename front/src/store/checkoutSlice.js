import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orderId: null,
  totalPrice: 0,
  status: null,          // pending | paid
  paymentMethod: null,   // transfer | qpay
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setPaymentPending(state, action) {
      state.orderId = action.payload.orderId;
      state.totalPrice = action.payload.totalPrice;
      state.status = "pending";
    },

    setPaymentMethod(state, action) {
      state.paymentMethod = action.payload;
    },

    setPaymentPaid(state) {
      state.status = "paid";
    },

    clearCheckout() {
      return initialState;
    },
  },
});

export const {
  setPaymentPending,
  setPaymentMethod,
  setPaymentPaid,
  clearCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
