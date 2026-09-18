import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const startValue = 0;
        const endValue = value;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (endValue - startValue) + startValue);
            setDisplayValue(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return (
        <span>
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
        </span>
    );
};

export default AnimatedNumber;
