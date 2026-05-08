/**
 * Redux Store Configuration
 * Combines all slices and configures persistence with AsyncStorage
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';

// Persist configuration
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    version: 1,
    whitelist: ['auth'], // Only persist auth slice
    timeout: 100000, // 100 seconds
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

/**
 * Configure Redux store
 */
export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
    },
    middleware: (getDefaultMiddleware: any) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore redux-persist actions
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

/**
 * Create persistor for rehydration
 */
export const persistor = persistStore(store);

/**
 * Root state type
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type with thunk support
 */
export type AppDispatch = typeof store.dispatch;

/**
 * App thunk type (fallback to any until proper types are available)
 */
export type AppThunk = any;

export default store;
