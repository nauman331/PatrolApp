import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// Async thunk: Delete a site by ID
export const deleteSite = createAsyncThunk(
  "deleteSite/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete-site/${id}`,{
        headers: authHeaders(),
      });
      return { id };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete site" }
      );
    }
  }
);

const deleteSiteSlice = createSlice({
  name: "deleteSite",
  initialState: {
    loading: false,
    success: false,
    deletedId: null,
    error: null,
  },
  reducers: {
    resetDeleteSite: (state) => {
      state.loading = false;
      state.success = false;
      state.deletedId = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteSite.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.deletedId = null;
        state.error = null;
      })
      .addCase(deleteSite.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.deletedId = action.payload.id;
        state.error = null;
      })
      .addCase(deleteSite.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetDeleteSite } = deleteSiteSlice.actions;
export default deleteSiteSlice.reducer;