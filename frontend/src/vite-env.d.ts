/// <reference types="vite/client" />
/// <reference types="vite-plugin-pages/client-react" />

declare module '~react-pages' {
    import type { RouteObject } from 'react-router-dom'
    const routes: RouteObject[]
    export default routes
}

// Allow opting out of the automatic token-refresh interceptor per request.
import 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipAuthRefresh?: boolean;
    }
}
