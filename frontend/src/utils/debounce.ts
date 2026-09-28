/**
 * Returns a debounced version of `fn` that delays invocation until `wait` ms
 * have elapsed since the last call. Used to throttle preference persistence.
 */
export const debounce = <Args extends unknown[]>(
    fn: (...args: Args) => void,
    wait: number
): ((...args: Args) => void) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, wait);
    };
};
