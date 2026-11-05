import { createSlice } from "@reduxjs/toolkit";

const promotionSlice = createSlice({
  name: "promotion",
  initialState: null,
  reducers: {
    setPromotion(state, action) {
      return action.payload;
    },
    clearPromotion() {
      return null;
    },
  },
});

export const { setPromotion, clearPromotion } = promotionSlice.actions;
export default promotionSlice.reducer;
