import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { getGuardMyJobs } from '../../services/guardApi';
import type { RootState } from '../store';

export interface JobsState {
  items: unknown[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchGuardJobs = createAsyncThunk<
  unknown[],
  void,
  { rejectValue: string }
>('jobs/fetchGuardJobs', async (_arg, { rejectWithValue }) => {
  const result = await getGuardMyJobs();
  if (!result.success) {
    return rejectWithValue(result.message ?? 'Failed to load shifts');
  }
  return result.data ?? [];
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobsError(state: JobsState) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGuardJobs.pending, (state: JobsState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchGuardJobs.fulfilled,
        (state: JobsState, action: PayloadAction<unknown[]>) => {
          state.loading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchGuardJobs.rejected, (state: JobsState, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          'Failed to load shifts';
      });
  },
});

export const { clearJobsError } = jobsSlice.actions;
export default jobsSlice.reducer;

export const selectJobsItems = (state: RootState) => state.jobs.items;
export const selectJobsLoading = (state: RootState) => state.jobs.loading;
export const selectJobsError = (state: RootState) => state.jobs.error;
