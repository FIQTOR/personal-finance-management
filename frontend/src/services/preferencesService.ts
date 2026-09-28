import apiClient from '@/services/apiClient';
import type { ApiResponse, UserPreferences } from '@/types';

/**
 * Persist a subset of the authenticated user's preferences to the account so
 * they follow the user across devices. Fire-and-forget: callers ignore errors
 * (localStorage remains the optimistic/offline fallback).
 */
export const savePreferences = async (
    preferences: { theme?: 'light' | 'dark'; language?: string }
): Promise<void> => {
    await apiClient.put<ApiResponse<UserPreferences>>('/preferences', preferences);
};

/**
 * Fetch the authenticated user's preferences from the account.
 */
export const fetchPreferences = async (): Promise<UserPreferences> => {
    const res = await apiClient.get<ApiResponse<UserPreferences>>('/preferences');
    return res.data.data;
};
