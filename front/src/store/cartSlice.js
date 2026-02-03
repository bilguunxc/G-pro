import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: null,
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartUser(state, action) {
      if (state.userId !== action.payload) {
        state.userId = action.payload;
        state.items = [];
      }
    },

    addToCart(state, action) {
      const item = action.payload;
    
      if (!item || !item.id) {
        console.warn("Invalid item added to cart:", item);
        return;
      }
    
      const existing = state.items.find(
        (i) => i.id === item.id
      );
    
      if (existing) {
        existing.qty += 1;
      } else {
        state.items.push({ ...item, qty: 1 });
      }
    },
    

    increaseQty(state, action) {
      const item = state.items.find(
        (i) => i.id === action.payload
      );
      if (item) item.qty += 1;
    },

    decreaseQty(state, action) {
      const item = state.items.find(
        (i) => i.id === action.payload
      );
      if (item && item.qty > 1) {
        item.qty -= 1;
      }
    },

    removeFromCart(state, action) {
      state.items = state.items.filter(
        (i) => i.id !== action.payload
      );
    },

    clearCart(state) {
      state.items = [];
    },

    resetCart(state) {
      state.userId = null;
      state.items = [];
    },
  },
});

export const {
  setCartUser,
  addToCart,
  increaseQty,
  decreaseQty,
  removeFromCart,
  clearCart,
  resetCart,
} = cartSlice.actions;

export default cartSlice.reducer;
