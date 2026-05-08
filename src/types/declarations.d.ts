declare module '@react-navigation/native-stack' {
    export function createNativeStackNavigator<ParamList extends Record<string, any> = any>(): any;
    export type NativeStackNavigationProp<T = any> = any;
    export type NativeStackScreenProps<T = any, K extends keyof T = any> = any;
}

declare module '@react-navigation/native' {
    export function useNavigation<T = any>(): T;
    export const NavigationContainer: any;
}

declare module '@reduxjs/toolkit' {
    export const configureStore: any;
    export const createSlice: any;
    export type ThunkAction = any;
    export type Action = any;
}

declare module 'react-redux' {
    export const Provider: any;
    export function useDispatch(): any;
    export function useSelector(selector: any): any;
}

declare module 'redux-persist' {
    export const persistStore: any;
    export const persistReducer: any;
    export const FLUSH: any;
    export const REHYDRATE: any;
    export const PAUSE: any;
    export const PERSIST: any;
    export const PURGE: any;
    export const REGISTER: any;
}

declare module 'redux-persist/integration/react' {
    export const PersistGate: any;
}

declare module 'redux' {
    export const createStore: any;
    export const applyMiddleware: any;
}
