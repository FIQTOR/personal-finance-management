// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import financeReducer from "./financeSlice";
import { injectStore } from "@/utils/axiosJWT";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        finance: financeReducer,
    },
});

// Inject store into axiosJWT to break circular dependency
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
