import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

export interface Site {
  id: number;
  user_id: number;
  site_name: string;
  site_description: string;
  address: string;
  coordinates: string;
  latitude: string;
  longitude: string;
  signin_radius: number;
  state: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export const fetchAllSites = createAsyncThunk(
  "allSites/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/get-all-sites`,{
        headers: authHeaders()  
        
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch sites" }
      );
    }
  }
);

const allSitesSlice = createSlice({
  name: "allSites",
  initialState: {
    loading: false,
    sites: [] as Site[],
    error: null as any,
  },
  reducers: {
    resetAllSites: (state) => {
      state.loading = false;
      state.sites = [];
      state.error = null;
    },
    // Optimistic removal after delete
    removeSiteById: (state, action) => {
      state.sites = state.sites.filter((s) => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSites.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload.data || action.payload;
      })
      .addCase(fetchAllSites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAllSites, removeSiteById } = allSitesSlice.actions;
export default allSitesSlice.reducer;