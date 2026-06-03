import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slice/auth-management/authSlice';
import userReducer from './slice/user-management/addUserSlice';
import createSiteReducer from './slice/sites-&-sops/CreateSiteSlice';
import deleteSiteReducer from './slice/sites-&-sops/Deletesiteslice';
import editSiteReducer from './slice/sites-&-sops/EditSiteSlice';
import allSitesReducer from './slice/sites-&-sops/Allsitesslice';
import nfcReducer from './slice/nfc-management/nfcSlice';
import nfcListReducer from './slice/nfc-management/nfcListSlice';
import nfcDeleteReducer from './slice/nfc-management/nfcDeleteSlice';
import nfcEditsReducer from './slice/nfc-management/nfcEditsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    createSite: createSiteReducer,
    deleteSite: deleteSiteReducer,
    editSite: editSiteReducer,
    allSites: allSitesReducer,
    nfc: nfcReducer, 
    nfcList: nfcListReducer,
    nfcDelete: nfcDeleteReducer,
    nfcEdits: nfcEditsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;