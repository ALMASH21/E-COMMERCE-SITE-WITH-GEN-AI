import { createSlice } from "@reduxjs/toolkit";
const cartSlice = createSlice({
  name: "cart",
  initialState: [],
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const existing = state.find((item) => item.id === product.id);
      const quantity = product.quantity || 1;

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.push({ ...product, quantity });
      }
    },
    changeCartQuantity(state, action) {
      const { productId, amount } = action.payload;
      return state
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0);
    },
    removeFromCart(state, action) {
      return state.filter((item) => item.id !== action.payload);
    },
    clearCart() {
      return [];
    },
  },
});

export const { addToCart, changeCartQuantity, clearCart, removeFromCart } = cartSlice.actions;
export default cartSlice.reducer;
