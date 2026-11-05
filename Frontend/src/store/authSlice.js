import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function requestAuth(path, options, rejectWithValue) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: options?.body
        ? { "Content-Type": "application/json", ...options.headers }
        : options?.headers,
    });
  } catch {
    return rejectWithValue({ message: "Unable to connect to the server." });
  }

  const contentType = response.headers.get("content-type") || "";
  let result = {};
  if (contentType.includes("application/json")) {
    try {
      result = await response.json();
    } catch {
      return rejectWithValue({
        message: "The authentication server returned an invalid response.",
        status: response.status,
      });
    }
  }
  if (!response.ok) {
    return rejectWithValue({
      message: result.message || (response.status === 502
        ? "The authentication service is unavailable. Please start the backend and try again."
        : "Authentication failed. Please try again."),
      status: response.status,
    });
  }
  if (!contentType.includes("application/json")) {
    return rejectWithValue({
      message: "The authentication server returned an unexpected response.",
      status: response.status,
    });
  }
  if (path !== "/users/logout" && (!result.user || typeof result.user !== "object")) {
    return rejectWithValue({
      message: "The authentication server returned an invalid account response.",
      status: response.status,
    });
  }
  return result;
}

export const registerAccount = createAsyncThunk(
  "auth/register",
  (account, { rejectWithValue }) =>
    requestAuth("/users/register", {
      method: "POST",
      body: JSON.stringify(account),
    }, rejectWithValue),
);

export const loginAccount = createAsyncThunk(
  "auth/login",
  (credentials, { rejectWithValue }) =>
    requestAuth("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }, rejectWithValue),
);

export const loginOwnerAccount = createAsyncThunk(
  "auth/loginOwner",
  (credentials, { rejectWithValue }) =>
    requestAuth("/owners/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }, rejectWithValue),
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  (_, { rejectWithValue }) => requestAuth("/users/profile", {}, rejectWithValue),
  {
    condition: (_, { getState }) => {
      const { auth } = getState();
      return auth.status !== "authenticated" && auth.profileStatus !== "loading";
    },
  },
);

export const logoutAccount = createAsyncThunk(
  "auth/logout",
  (_, { rejectWithValue }) =>
    requestAuth("/users/logout", { method: "POST" }, rejectWithValue),
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    profileStatus: "idle",
    profileRequestId: null,
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setAuthError(state, action) {
      state.error = action.payload;
    },
    updateAuthenticatedUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentUser.pending, (state, action) => {
        state.profileStatus = "loading";
        state.profileRequestId = action.meta.requestId;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) return;
        state.user = action.payload.user;
        state.profileStatus = "succeeded";
        state.status = "authenticated";
        state.profileRequestId = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (action.meta.condition || state.profileRequestId !== action.meta.requestId) return;
        state.profileStatus = "failed";
        state.profileRequestId = null;
        if (action.payload?.status === 401) {
          state.user = null;
          state.status = "unauthenticated";
        } else {
          state.error = action.payload?.message || action.error.message;
        }
      })
      .addCase(logoutAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(logoutAccount.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.profileStatus = "idle";
        state.profileRequestId = null;
        state.error = null;
      })
      .addCase(logoutAccount.rejected, (state, action) => {
        state.error = action.payload?.message || action.error.message;
      })
      .addMatcher(
        (action) =>
          [loginAccount.pending.type, registerAccount.pending.type, loginOwnerAccount.pending.type].includes(action.type),
        (state) => {
          state.status = "loading";
          state.profileStatus = "idle";
          state.profileRequestId = null;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          [loginAccount.fulfilled.type, registerAccount.fulfilled.type, loginOwnerAccount.fulfilled.type].includes(action.type),
        (state, action) => {
          state.user = action.payload.user;
          state.status = "authenticated";
          state.profileStatus = "succeeded";
          state.profileRequestId = null;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          [loginAccount.rejected.type, registerAccount.rejected.type, loginOwnerAccount.rejected.type].includes(action.type),
        (state, action) => {
          state.status = "unauthenticated";
          state.profileRequestId = null;
          state.error = action.payload?.message || action.error.message;
        },
      );
  },
});

export const { clearAuthError, setAuthError, updateAuthenticatedUser } = authSlice.actions;
export default authSlice.reducer;
