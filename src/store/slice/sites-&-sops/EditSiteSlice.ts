import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunk: Fetch single site for editing
export const fetchSiteById = createAsyncThunk(
  "editSite/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/edit-site/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch site" }
      );
    }
  }
);

// Async thunk: Update an existing site
// ✅ FIX: siteData is FormData (not JSON) so we must NOT set Content-Type.
// Axios will automatically set multipart/form-data with the correct boundary.
export const updateSite = createAsyncThunk(
  "editSite/update",
  async (
    { id, siteData }: { id: number; siteData: FormData },
    { rejectWithValue }
  ) => {
    try {
      // ✅ Laravel requires _method=PUT when submitting FormData (multipart)
      // because PHP/Laravel cannot parse PUT multipart bodies natively.
      siteData.append("_method", "PUT");

      const response = await axios.post(
        `${BASE_URL}/update-site/${id}`,
        siteData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
            'Content-Type': 'multipart/form-data'
            // ❌ DO NOT set Content-Type here — axios sets it automatically
            // with the correct multipart boundary when sending FormData.
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update site" }
      );
    }
  }
);

const editSiteSlice = createSlice({
  name: "editSite",
  initialState: {
    // fetch state
    fetchLoading: false,
    currentSite: null,
    fetchError: null,

    // update state
    updateLoading: false,
    updateSuccess: false,
    updateError: null,
  },
  reducers: {
    resetEditSite: (state) => {
      state.fetchLoading = false;
      state.currentSite = null;
      state.fetchError = null;
      state.updateLoading = false;
      state.updateSuccess = false;
      state.updateError = null;
    },
    resetUpdateStatus: (state) => {
      state.updateLoading = false;
      state.updateSuccess = false;
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchSiteById
    builder
      .addCase(fetchSiteById.pending, (state) => {
        state.fetchLoading = true;
        state.fetchError = null;
        state.currentSite = null;
      })
      .addCase(fetchSiteById.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.currentSite = action.payload;
        state.fetchError = null;
      })
      .addCase(fetchSiteById.rejected, (state, action) => {
        state.fetchLoading = false;
        state.fetchError = action.payload;
      });

    // updateSite
    builder
      .addCase(updateSite.pending, (state) => {
        state.updateLoading = true;
        state.updateSuccess = false;
        state.updateError = null;
      })
      .addCase(updateSite.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;
        state.currentSite = action.payload;
        state.updateError = null;
      })
      .addCase(updateSite.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = false;
        state.updateError = action.payload;
      });
  },
});

export const { resetEditSite, resetUpdateStatus } = editSiteSlice.actions;
export default editSiteSlice.reducer;