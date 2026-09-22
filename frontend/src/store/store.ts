// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import financeReducer from "./financeSlice";
import { injectStore } from "@/services/apiClient";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        finance: financeReducer,
    },
});

// Inject store into the API client to break the circular dependency
// (authSlice -> apiClient -> store).
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
