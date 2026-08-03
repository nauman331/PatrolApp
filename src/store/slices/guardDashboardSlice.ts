import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getGuardDashboardData, type GuardDashboardData } from '../../services/guardApi';
import type { RootState } from '../store';

export interface GuardDashboardState {
  data: GuardDashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: GuardDashboardState = {
  data: null,
  loading: false,
  refreshing: false,
  error: null,
  lastUpdated: null,
};

export const fetchGuardDashboard = createAsyncThunk<
  GuardDashboardData,
  string | number | null,
  { rejectValue: string }
>('guardDashboard/fetch', async (guardId, { rejectWithValue }) => {
  const result = await getGuardDashboardData(guardId);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load dashboard');
  }
  return result.data;
});

const guardDashboardSlice = createSlice({
  name: 'guardDashboard',
  initialState,
  reducers: {
    setRefreshing(state, action: PayloadAction<boolean>) {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuardDashboard.pending, (state) => {
        // Only set global loading (shimmer) if we don't have existing data
        if (!state.data) {
          state.loading = true;
        } else {
          state.refreshing = true;
        }
        state.error = null;
      })
      .addCase(fetchGuardDashboard.fulfilled, (state, action: PayloadAction<GuardDashboardData>) => {
        state.loading = false;
        state.refreshing = false;
        state.data = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchGuardDashboard.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = (action.payload as string) ?? 'Failed to load dashboard';
      });
  },
});

export const { setRefreshing } = guardDashboardSlice.actions;
export default guardDashboardSlice.reducer;

export const selectDashboardData = (state: RootState) => state.guardDashboard.data;
export const selectDashboardLoading = (state: RootState) => state.guardDashboard.loading;
export const selectDashboardRefreshing = (state: RootState) => state.guardDashboard.refreshing;
export const selectDashboardError = (state: RootState) => state.guardDashboard.error;
