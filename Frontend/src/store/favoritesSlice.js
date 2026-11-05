import { createSlice } from "@reduxjs/toolkit";

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: [],
  reducers: {
    toggleFavorite(state, action) {
      const index = state.indexOf(action.payload);
      if (index >= 0) state.splice(index, 1);
      else state.push(action.payload);
    },
    setFavorites(state, action) {
      return action.payload;
    },
  },
});

export const { toggleFavorite, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
