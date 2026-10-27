/**
 * SpaceCanvasStarfield Component
 *
 * Cinematic Golden Space Theme for JARVIS:
 * - Deep black (#030712) and midnight navy canvas background
 * - Small realistic golden stars floating slowly in space with parallax depth
 * - Subtle golden cosmic dust clouds drifting smoothly
 * - Soft warm amber lighting vignette
 * - Lightweight 60fps rendering optimized for Windows laptops with 16GB RAM
 */

import React, { useEffect, useRef } from 'react';
import { AIStateMode } from '../../types/index.ts';
import { SpaceThemeId, SpaceThemeConfig, SPACE_THEME_CATALOG } from '../../types/spaceTheme.ts';

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  depth: number; // 0.1 (distant) to 1.0 (foreground)
  twinklePhase: number;
  twinkleSpeed: number;
  baseAlpha: number;
  color: string;
}

interface CosmicDustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
}

interface SpaceCanvasStarfieldProps {
  state?: AIStateMode;
  theme?: SpaceThemeId;
  className?: string;
  enableInteractiveWaves?: boolean;
}

export const SpaceCanvasStarfield: React.FC<SpaceCanvasStarfieldProps> = ({
  state = 'IDLE',
  theme = 'SOLAR_GOLD',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AIStateMode>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let stars: StarParticle[] = [];
    let dustParticles: CosmicDustParticle[] = [];

    // Warm golden starlight palette
    const STAR_COLORS = [
      '#FFFFFF', // pure diamond
      '#FFF8DC', // cornsilk gold
      '#FFD76A', // bright gold
      '#D4AF37', // metallic gold
      '#F59E0B', // warm amber
      '#FDE68A', // soft starlight
    ];

    const initSpace = () => {
      // 1. Realistic Small Golden Stars (calibrated density: ~160 stars for desktop)
      const starCount = Math.min(220, Math.max(90, Math.floor((width * height) / 9000)));
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const depth = Math.random() * 0.9 + 0.1;
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          // Ultra-slow, majestic cosmic drift
          vx: (Math.random() - 0.5) * 0.04 * depth,
          vy: -0.03 * depth - Math.random() * 0.03 * depth,
          // Fine pinpoint sizes: 0.6px to 1.6px max (realistic, never cartoonish)
          baseRadius: depth > 0.8 ? 1.4 + Math.random() * 0.4 : depth > 0.4 ? 0.9 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3,
          depth,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.6 + Math.random() * 1.6,
          baseAlpha: 0.25 + depth * 0.5,
          color,
        });
      }

      // 2. Subtle Golden Cosmic Dust (soft drifting micro-nebulae)
      const dustCount = 24;
      dustParticles = [];
      for (let i = 0; i < dustCount; i++) {
        dustParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          radius: 60 + Math.random() * 140,
          alpha: 0.015 + Math.random() * 0.025,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initSpace();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initSpace();
    };

    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const currentState = stateRef.current;
      const isFast = currentState === 'THINKING' || currentState === 'EXECUTING';

      // 1. Deep Black and Midnight Navy Background (#030712 + subtle #050B1A depth)
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Midnight Navy subtle horizon gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#060D20'); // midnight navy core
      bgGrad.addColorStop(0.55, '#040816');
      bgGrad.addColorStop(1, '#030712'); // pure deep black perimeter
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Soft Amber Lighting Vignette (Atmospheric warmth)
      const amberVignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        30,
        width * 0.5,
        height * 0.5,
        width * 0.65
      );
      amberVignette.addColorStop(0, 'rgba(212, 175, 55, 0.04)');
      amberVignette.addColorStop(0.4, 'rgba(245, 158, 11, 0.02)');
      amberVignette.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = amberVignette;
      ctx.fillRect(0, 0, width, height);

      // 3. Subtle Golden Cosmic Dust Clouds
      for (let i = 0; i < dustParticles.length; i++) {
        const dust = dustParticles[i];
        dust.x += dust.vx;
        dust.y += dust.vy;
        dust.pulsePhase += dt * 0.4;

        if (dust.x < -dust.radius) dust.x = width + dust.radius;
        if (dust.x > width + dust.radius) dust.x = -dust.radius;
        if (dust.y < -dust.radius) dust.y = height + dust.radius;
        if (dust.y > height + dust.radius) dust.y = -dust.radius;

        const currentAlpha = dust.alpha * (0.8 + Math.sin(dust.pulsePhase) * 0.2);
        const dustGrad = ctx.createRadialGradient(dust.x, dust.y, 0, dust.x, dust.y, dust.radius);
        dustGrad.addColorStop(0, `rgba(212, 175, 55, ${currentAlpha})`);
        dustGrad.addColorStop(0.5, `rgba(245, 158, 11, ${currentAlpha * 0.4})`);
        dustGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.fillStyle = dustGrad;
        ctx.beginPath();
        ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Small Realistic Golden Stars Floating Slowly in Space
      const speedMult = isFast ? 1.8 : 1.0;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx * speedMult;
        star.y += star.vy * speedMult;

        // Wrap around boundaries
        if (star.x < 0) star.x = width;
        else if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        else if (star.y > height) star.y = 0;

        star.twinklePhase += dt * star.twinkleSpeed;
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;
        const alpha = Math.min(1, Math.max(0.12, star.baseAlpha * 0.7 + twinkle * 0.3));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;

        // Draw clean pinpoint star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle diffraction glow on brightest foreground stars
        if (star.depth > 0.85 && twinkle > 0.75) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.baseRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 215, 106, 0.2)';
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    />
  );
};
