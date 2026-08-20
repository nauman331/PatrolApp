import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import {
  getManagerDashboard,
  type ManagerDashboardData,
} from '../../services/managerApi';
import type { RootState } from '../store';

export interface ManagerDashboardState {
  data: ManagerDashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedDate: string; // ISO string
}

const initialState: ManagerDashboardState = {
  data: null,
  loading: false,
  refreshing: false,
  error: null,
  selectedDate: new Date().toISOString(),
};

export const fetchManagerDashboard = createAsyncThunk<
  ManagerDashboardData,
  string | undefined,
  { rejectValue: string }
>('managerDashboard/fetch', async (date, { rejectWithValue }) => {
  const result = await getManagerDashboard(date);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load dashboard');
  }
  return result.data;
});

const managerDashboardSlice = createSlice({
  name: 'managerDashboard',
  initialState,
  reducers: {
    clearManagerDashboardError(state: ManagerDashboardState) {
      state.error = null;
    },
    clearManagerDashboard(state: ManagerDashboardState) {
      state.data = null;
      state.error = null;
      state.loading = false;
      state.refreshing = false;
    },
    setSelectedDate(state, action: PayloadAction<string>) {
      state.selectedDate = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchManagerDashboard.pending, (state: ManagerDashboardState) => {
        if (!state.data) {
          state.loading = true;
        } else {
          state.refreshing = true;
        }
        state.error = null;
      })
      .addCase(
        fetchManagerDashboard.fulfilled,
        (
          state: ManagerDashboardState,
          action: PayloadAction<ManagerDashboardData>,
        ) => {
          state.loading = false;
          state.refreshing = false;
          state.data = action.payload;
        },
      )
      .addCase(
        fetchManagerDashboard.rejected,
        (state: ManagerDashboardState, action) => {
          state.loading = false;
          state.refreshing = false;
          state.error =
            (action.payload as string) ??
            action.error.message ??
            'Failed to load dashboard';
        },
      );
  },
});

export const { clearManagerDashboardError, clearManagerDashboard, setSelectedDate } =
  managerDashboardSlice.actions;
export default managerDashboardSlice.reducer;

export const selectManagerDashboard = (state: RootState) =>
  state.managerDashboard.data;
export const selectManagerDashboardLoading = (state: RootState) =>
  state.managerDashboard.loading;
export const selectManagerDashboardRefreshing = (state: RootState) =>
  state.managerDashboard.refreshing;
export const selectManagerDashboardError = (state: RootState) =>
  state.managerDashboard.error;
export const selectManagerDashboardDate = (state: RootState) =>
  state.managerDashboard.selectedDate;
