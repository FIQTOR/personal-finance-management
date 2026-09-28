/**
 * Savings-goal forecasting helpers.
 *
 * Pure functions (no React / Redux) so they can be unit-tested and reused by
 * any view. Amounts are accepted as `number | string` because the API returns
 * Sequelize DECIMAL columns as strings.
 */
import type { Goal } from '@/types/finance';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
/** Rate window used when a goal has no usable `created_at`. */
const DEFAULT_PACE_DAYS = 30;

export interface GoalForecast {
    /** Percentage of the target saved so far (clamped to [0, 100]). */
    progressPercent: number;
    /** ISO `YYYY-MM-DD` projected completion date, or `null` when we cannot project. */
    projectedDate: string | null;
    /** Monthly saving required to hit `deadline` (0 when already complete or no time left). */
    requiredMonthly: number;
    /** Whether the current saving pace will reach the target on or before the deadline. */
    onTrack: boolean;
    /** Whole days until the deadline (negative when the deadline has passed). */
    daysRemaining: number;
    /** True once `current_amount >= target_amount`. */
    completed: boolean;
}

const toNumber = (value: number | string | null | undefined): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

/** Whole-day difference between two dates (b - a), rounded toward zero. */
const diffInDays = (a: Date, b: Date): number => Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

const parseDate = (value: string | undefined | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Forecast a single savings goal.
 *
 * Saving pace is derived from `current_amount / elapsedDays` where elapsedDays
 * runs from the goal's `created_at` (falling back to 30 days ago when the
 * timestamp is missing/invalid) up to `now`.
 *
 * - `requiredMonthly` = remaining / (daysRemaining / 30), i.e. the flat monthly
 *   contribution needed to reach the target by the deadline.
 * - `projectedDate` = now + (remaining / dailyPace) days, using the historical
 *   pace (falls back to the required pace when no pace can be measured).
 * - `onTrack` = the projection lands on/before the deadline, or the goal is done.
 *
 * Edge cases handled: deadline in the past, zero progress, zero elapsed time,
 * and `target_amount === 0`.
 */
export const forecastGoal = (goal: Goal, now: Date = new Date()): GoalForecast => {
    const target = toNumber(goal.target_amount);
    const current = toNumber(goal.current_amount);
    const remaining = Math.max(target - current, 0);
    const completed = target > 0 && current >= target;

    const progressPercent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    const deadline = parseDate(goal.deadline);
    const daysRemaining = deadline ? diffInDays(now, deadline) : 0;

    // No time left (deadline passed) => cannot save further; nothing required.
    if (daysRemaining <= 0 || remaining <= 0 || target <= 0) {
        return {
            progressPercent: target <= 0 ? 0 : progressPercent,
            projectedDate: completed ? toISODate(now) : null,
            requiredMonthly: 0,
            onTrack: completed && (target > 0),
            daysRemaining,
            completed,
        };
    }

    const monthsRemaining = daysRemaining / 30;

    // Elapsed pace window.
    const created = parseDate(goal.created_at);
    const start = created ?? new Date(now.getTime() - DEFAULT_PACE_DAYS * MS_PER_DAY);
    const elapsedDays = Math.max(diffInDays(start, now), 1);
    const dailyPace = current / elapsedDays;

    // Projected completion at the *current* pace; fall back to the required
    // pace (deadline-driven) when no measurable progress has been made yet.
    const fallbackPace = remaining / daysRemaining;
    const effectivePace = dailyPace > 0 ? dailyPace : fallbackPace;
    const daysToComplete = effectivePace > 0 ? Math.ceil(remaining / effectivePace) : null;

    const projected = daysToComplete !== null ? new Date(now.getTime() + daysToComplete * MS_PER_DAY) : null;

    const requiredMonthly = remaining / monthsRemaining;
    const onTrack = projected !== null && diffInDays(now, projected) <= daysRemaining;

    return {
        progressPercent,
        projectedDate: projected ? toISODate(projected) : null,
        requiredMonthly,
        onTrack,
        daysRemaining,
        completed,
    };
};
