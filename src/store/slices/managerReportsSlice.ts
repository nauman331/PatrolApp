import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getManagerPatrolReports, getManagerIncidentReports, type ManagerPatrolReportsData, type ManagerIncidentReportsData } from '../../services/managerApi';
import type { RootState } from '../store';

export type ReportTab = 'patrol' | 'incident';
export type DateFilter = 'Today' | 'This Week' | 'This Month' | 'Custom';

export interface ManagerReportsState {
  patrolReports: ManagerPatrolReportsData | null;
  incidentReports: ManagerIncidentReportsData | null;
  loadingPatrols: boolean;
  loadingIncidents: boolean;
  refreshingPatrols: boolean;
  refreshingIncidents: boolean;
  error: string | null;
  // Filter states
  tab: ReportTab;
  dateFilter: DateFilter;
  search: string;
  selectedGuardIds: number[];
  selectedSiteIds: number[];
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

const initialState: ManagerReportsState = {
  patrolReports: null,
  incidentReports: null,
  loadingPatrols: false,
  loadingIncidents: false,
  refreshingPatrols: false,
  refreshingIncidents: false,
  error: null,
  tab: 'patrol',
  dateFilter: 'Today',
  search: '',
  selectedGuardIds: [],
  selectedSiteIds: [],
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
};

export const fetchManagerPatrolReports = createAsyncThunk<
  ManagerPatrolReportsData,
  any,
  { rejectValue: string }
>('managerReports/fetchPatrols', async (params, { rejectWithValue }) => {
  const result = await getManagerPatrolReports(params);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load patrol reports');
  }
  return result.data;
});

export const fetchManagerIncidentReports = createAsyncThunk<
  ManagerIncidentReportsData,
  any,
  { rejectValue: string }
>('managerReports/fetchIncidents', async (params, { rejectWithValue }) => {
  const result = await getManagerIncidentReports(params);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load incident reports');
  }
  return result.data;
});

const managerReportsSlice = createSlice({
  name: 'managerReports',
  initialState,
  reducers: {
    clearReportsError(state) {
      state.error = null;
    },
    setTab(state, action: PayloadAction<ReportTab>) {
      state.tab = action.payload;
    },
    setDateFilter(state, action: PayloadAction<DateFilter>) {
      state.dateFilter = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setSelectedGuardIds(state, action: PayloadAction<number[]>) {
      state.selectedGuardIds = action.payload;
    },
    setSelectedSiteIds(state, action: PayloadAction<number[]>) {
      state.selectedSiteIds = action.payload;
    },
    setCustomDates(state, action: PayloadAction<{ startDate: string; endDate: string }>) {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    resetFilters(state) {
      state.dateFilter = 'Today';
      state.search = '';
      state.selectedGuardIds = [];
      state.selectedSiteIds = [];
      state.startDate = new Date().toISOString();
      state.endDate = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerPatrolReports.pending, (state) => {
        if (!state.patrolReports) {
          state.loadingPatrols = true;
        } else {
          state.refreshingPatrols = true;
        }
        state.error = null;
      })
      .addCase(fetchManagerPatrolReports.fulfilled, (state, action) => {
        state.loadingPatrols = false;
        state.refreshingPatrols = false;
        state.patrolReports = action.payload;
      })
      .addCase(fetchManagerPatrolReports.rejected, (state, action) => {
        state.loadingPatrols = false;
        state.refreshingPatrols = false;
        state.error = action.payload ?? 'Failed to load patrol reports';
      })
      .addCase(fetchManagerIncidentReports.pending, (state) => {
        if (!state.incidentReports) {
          state.loadingIncidents = true;
        } else {
          state.refreshingIncidents = true;
        }
        state.error = null;
      })
      .addCase(fetchManagerIncidentReports.fulfilled, (state, action) => {
        state.loadingIncidents = false;
        state.refreshingIncidents = false;
        state.incidentReports = action.payload;
      })
      .addCase(fetchManagerIncidentReports.rejected, (state, action) => {
        state.loadingIncidents = false;
        state.refreshingIncidents = false;
        state.error = action.payload ?? 'Failed to load incident reports';
      });
  },
});

export const {
  clearReportsError,
  setTab,
  setDateFilter,
  setSearch,
  setSelectedGuardIds,
  setSelectedSiteIds,
  setCustomDates,
  resetFilters
} = managerReportsSlice.actions;
export default managerReportsSlice.reducer;

export const selectManagerPatrolReports = (state: RootState) => state.managerReports.patrolReports;
export const selectManagerIncidentReports = (state: RootState) => state.managerReports.incidentReports;
export const selectLoadingPatrols = (state: RootState) => state.managerReports.loadingPatrols;
export const selectLoadingIncidents = (state: RootState) => state.managerReports.loadingIncidents;
export const selectReportsFilters = (state: RootState) => ({
  tab: state.managerReports.tab,
  dateFilter: state.managerReports.dateFilter,
  search: state.managerReports.search,
  selectedGuardIds: state.managerReports.selectedGuardIds,
  selectedSiteIds: state.managerReports.selectedSiteIds,
  startDate: state.managerReports.startDate,
  endDate: state.managerReports.endDate,
});
