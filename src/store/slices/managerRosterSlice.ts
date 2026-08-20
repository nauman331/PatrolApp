import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getManagerRosterShifts, getManagerRosterSites, type ManagerRosterShiftsData, type ManagerRosterSitesData } from '../../services/managerApi';
import type { RootState } from '../store';

export type RosterTab = 'shifts' | 'sites';
export type PeriodFilter = 'Today' | 'This Week' | 'This Month' | 'Custom';

export interface ManagerRosterState {
  shiftsData: ManagerRosterShiftsData | null;
  sitesData: ManagerRosterSitesData | null;
  loadingShifts: boolean;
  loadingSites: boolean;
  refreshingShifts: boolean;
  refreshingSites: boolean;
  error: string | null;
  // Filter states
  tab: RosterTab;
  periodFilter: PeriodFilter;
  search: string;
  selectedGuardIds: number[];
  selectedSiteIds: number[];
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

const initialState: ManagerRosterState = {
  shiftsData: null,
  sitesData: null,
  loadingShifts: false,
  loadingSites: false,
  refreshingShifts: false,
  refreshingSites: false,
  error: null,
  tab: 'shifts',
  periodFilter: 'Today',
  search: '',
  selectedGuardIds: [],
  selectedSiteIds: [],
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
};

export const fetchManagerShifts = createAsyncThunk<
  ManagerRosterShiftsData,
  any,
  { rejectValue: string }
>('managerRoster/fetchShifts', async (params, { rejectWithValue }) => {
  const result = await getManagerRosterShifts(params);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load shifts');
  }
  return result.data;
});

export const fetchManagerSites = createAsyncThunk<
  ManagerRosterSitesData,
  any,
  { rejectValue: string }
>('managerRoster/fetchSites', async (params, { rejectWithValue }) => {
  const result = await getManagerRosterSites(params);
  if (!result.success || !result.data) {
    return rejectWithValue(result.message ?? 'Failed to load sites');
  }
  return result.data;
});

const managerRosterSlice = createSlice({
  name: 'managerRoster',
  initialState,
  reducers: {
    clearRosterError(state) {
      state.error = null;
    },
    setTab(state, action: PayloadAction<RosterTab>) {
      state.tab = action.payload;
    },
    setPeriodFilter(state, action: PayloadAction<PeriodFilter>) {
      state.periodFilter = action.payload;
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
      state.periodFilter = 'Today';
      state.search = '';
      state.selectedGuardIds = [];
      state.selectedSiteIds = [];
      state.startDate = new Date().toISOString();
      state.endDate = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagerShifts.pending, (state) => {
        if (!state.shiftsData) {
          state.loadingShifts = true;
        } else {
          state.refreshingShifts = true;
        }
        state.error = null;
      })
      .addCase(fetchManagerShifts.fulfilled, (state, action) => {
        state.loadingShifts = false;
        state.refreshingShifts = false;
        state.shiftsData = action.payload;
      })
      .addCase(fetchManagerShifts.rejected, (state, action) => {
        state.loadingShifts = false;
        state.refreshingShifts = false;
        state.error = action.payload ?? 'Failed to load shifts';
      })
      .addCase(fetchManagerSites.pending, (state) => {
        if (!state.sitesData) {
          state.loadingSites = true;
        } else {
          state.refreshingSites = true;
        }
        state.error = null;
      })
      .addCase(fetchManagerSites.fulfilled, (state, action) => {
        state.loadingSites = false;
        state.refreshingSites = false;
        state.sitesData = action.payload;
      })
      .addCase(fetchManagerSites.rejected, (state, action) => {
        state.loadingSites = false;
        state.refreshingSites = false;
        state.error = action.payload ?? 'Failed to load sites';
      });
  },
});

export const {
  clearRosterError,
  setTab,
  setPeriodFilter,
  setSearch,
  setSelectedGuardIds,
  setSelectedSiteIds,
  setCustomDates,
  resetFilters
} = managerRosterSlice.actions;
export default managerRosterSlice.reducer;

export const selectManagerShifts = (state: RootState) => state.managerRoster.shiftsData;
export const selectManagerSites = (state: RootState) => state.managerRoster.sitesData;
export const selectLoadingShifts = (state: RootState) => state.managerRoster.loadingShifts;
export const selectLoadingSites = (state: RootState) => state.managerRoster.loadingSites;
export const selectRosterTab = (state: RootState) => state.managerRoster.tab;
export const selectRosterPeriodFilter = (state: RootState) => state.managerRoster.periodFilter;
export const selectRosterSearch = (state: RootState) => state.managerRoster.search;
export const selectRosterSelectedGuardIds = (state: RootState) => state.managerRoster.selectedGuardIds;
export const selectRosterSelectedSiteIds = (state: RootState) => state.managerRoster.selectedSiteIds;
export const selectRosterStartDate = (state: RootState) => state.managerRoster.startDate;
export const selectRosterEndDate = (state: RootState) => state.managerRoster.endDate;
export const selectRosterFilters = (state: RootState) => ({
  tab: state.managerRoster.tab,
  periodFilter: state.managerRoster.periodFilter,
  search: state.managerRoster.search,
  selectedGuardIds: state.managerRoster.selectedGuardIds,
  selectedSiteIds: state.managerRoster.selectedSiteIds,
  startDate: state.managerRoster.startDate,
  endDate: state.managerRoster.endDate,
});
