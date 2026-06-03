import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ✅ Only used for non-file requests
const jsonHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

// ✅ Used for FormData/file uploads — NO Content-Type so browser sets boundary
const multipartHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  Accept: "application/json",
});

export const createSite = createAsyncThunk(
  "createSite/create",
  async (siteData: FormData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("You must be logged in to add a site");

      const response = await axios.post(`${BASE_URL}/store-site`, siteData, {
        headers: multipartHeaders(), // ✅ Fixed: was using jsonHeaders() which broke file uploads
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create site" }
      );
    }
  }
);

interface CreateSiteState {
  loading: boolean;
  success: boolean;
  data: any;
  error: any;
}

const initialState: CreateSiteState = {
  loading: false,
  success: false,
  data: null,
  error: null,
};

const createSiteSlice = createSlice({
  name: "createSite",
  initialState,
  reducers: {
    resetCreateSite: (state) => {
      state.loading = false;
      state.success = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSite.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createSite.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(createSite.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetCreateSite } = createSiteSlice.actions;
export default createSiteSlice.reducer;