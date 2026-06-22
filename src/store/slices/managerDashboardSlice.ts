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
  error: string | null;
}

const initialState: ManagerDashboardState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchManagerDashboard = createAsyncThunk<
  ManagerDashboardData,
  void,
  { rejectValue: string }
>('managerDashboard/fetch', async (_arg, { rejectWithValue }) => {
  const result = await getManagerDashboard();
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
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchManagerDashboard.pending, (state: ManagerDashboardState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchManagerDashboard.fulfilled,
        (
          state: ManagerDashboardState,
          action: PayloadAction<ManagerDashboardData>,
        ) => {
          state.loading = false;
          state.data = action.payload;
        },
      )
      .addCase(
        fetchManagerDashboard.rejected,
        (state: ManagerDashboardState, action) => {
          state.loading = false;
          state.error =
            (action.payload as string) ??
            action.error.message ??
            'Failed to load dashboard';
        },
      );
  },
});

export const { clearManagerDashboardError, clearManagerDashboard } =
  managerDashboardSlice.actions;
export default managerDashboardSlice.reducer;

export const selectManagerDashboard = (state: RootState) =>
  state.managerDashboard.data;
export const selectManagerDashboardLoading = (state: RootState) =>
  state.managerDashboard.loading;
export const selectManagerDashboardError = (state: RootState) =>
  state.managerDashboard.error;
