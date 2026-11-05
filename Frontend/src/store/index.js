import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import cartReducer from "./cartSlice.js";
import favoritesReducer from "./favoritesSlice.js";
import promotionReducer from "./promotionSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    favorites: favoritesReducer,
    promotion: promotionReducer,
  },
});

export default store;
