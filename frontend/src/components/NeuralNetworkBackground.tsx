import React, { useEffect, useRef } from 'react';

interface NeuralNetworkBackgroundProps {
    className?: string;
}

const NeuralNetworkBackground: React.FC<NeuralNetworkBackgroundProps> = ({ className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const particleCount = Math.min(Math.floor((width * height) / 12000), 100);
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            pulse: number;
            pulseSpeed: number;
        }> = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.9,
                vy: (Math.random() - 0.5) * 0.9,
                radius: Math.random() * 2.5 + 1.5,
                pulse: Math.random() * Math.PI,
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const render = () => {
            const isDark = document.documentElement.classList.contains('dark');
            ctx.clearRect(0, 0, width, height);

            const nodeRgb = isDark ? '99, 102, 241' : '59, 130, 246';
            const lineRgb = isDark ? '139, 92, 246' : '99, 102, 241';

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += p.pulseSpeed;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                const currentRadius = p.radius + Math.sin(p.pulse) * 0.8;

                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0.5, currentRadius), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${nodeRgb}, 0.8)`;
                ctx.shadowColor = `rgba(${nodeRgb}, 0.5)`;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Mouse interaction distance
                const mdx = mouseX - p.x;
                const mdy = mouseY - p.y;
                const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mdist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = `rgba(${nodeRgb}, ${0.4 * (1 - mdist / 150)})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 140;

                    if (dist < maxDist) {
                        const alpha = (1 - dist / maxDist) * 0.4;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
        />
    );
};

export default NeuralNetworkBackground;
