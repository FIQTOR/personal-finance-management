import { Provider } from "react-redux";
import { store } from "@/store/store";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshToken, selectAuth } from "@/store/authSlice";
import LoadingPage from "@/components/LoadingPage";

function InitAuth({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const { isReady } = useAppSelector(selectAuth);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !isReady) {
            dispatch(refreshToken() as any);
        }
    }, [dispatch, isClient, isReady]);

    // Show loading or fallback during hydration
    if (!isClient || !isReady) {
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
