import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshToken, selectAuth } from "@/store/authSlice";
import LoadingPage from "@/components/LoadingPage";

function InitAuth({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const { isReady } = useAppSelector(selectAuth);

    useEffect(() => {
        if (!isReady) {
            dispatch(refreshToken());
        }
    }, [dispatch, isReady]);

    // Show loading fallback until the session has been resolved.
    if (!isReady) {
        return (
            <LoadingPage />
        );
    }

    return <>{children}</>;
}

export default function AuthProviders({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <InitAuth>{children}</InitAuth>
        </Provider>
    );
}
