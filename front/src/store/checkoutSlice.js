import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],             // [{ id, name, price, qty, ... }]
  source: null,          // cart | direct
  orderId: null,
  totalPrice: 0,
  status: null,          // pending | paid
  paymentMethod: null,   // transfer | qpay
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setCheckoutItems(state, action) {
      const items = action.payload?.items;
      const source = action.payload?.source;

      state.items = Array.isArray(items) ? items : [];
      state.source = typeof source === "string" ? source : null;

      // Starting a new checkout should reset any previous payment state.
      state.orderId = null;
      state.totalPrice = 0;
      state.status = null;
      state.paymentMethod = null;
    },

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
  setCheckoutItems,
  setPaymentPending,
  setPaymentMethod,
  setPaymentPaid,
  clearCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
