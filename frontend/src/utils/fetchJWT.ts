// utils/fetchJWT.ts
// Legacy shim — kept for backwards compatibility. The store is injected via
// `services/apiClient` (`injectStore`); no separate fetch wiring is required.
export { default, injectStore as injectStoreToFetch } from '@/services/apiClient';
