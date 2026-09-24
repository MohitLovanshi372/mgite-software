/**
 * SpaceCanvasStarfield / UltronCyberMatrix Component
 *
 * Implements a sleek, cinematic celestial starfield & cybernetic matrix backdrop:
 * - Multi-depth twinkling stellar field with parallax drift & pulsar diffraction flares
 * - High-tech cybernetic nodes & digital circuit conduits
 * - Smooth mount fade-in animation (gracefully emerging from the void)
 * - Seamless cinematic transition animation between space themes:
 *   * Continuous color interpolation (background, conduits, dust, glow, scanline)
 *   * Radial hyperspace shockwave wavefront sweeping outward
 *   * Celestial warp acceleration & stellar velocity shimmer
 *   * Holographic sector warp HUD telemetry
 * - Reactive state pulse (THINKING, EXECUTING, SECURITY_ALERT)
 */

import React, { useEffect, useRef } from 'react';
import { AIStateMode } from '../../types/index.ts';
import { SpaceThemeId, SpaceThemeConfig, SPACE_THEME_CATALOG } from '../../types/spaceTheme.ts';

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(str: string): RGBAColor {
  if (!str) return { r: 255, g: 255, b: 255, a: 1 };
  const trimmed = str.trim();
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const num = parseInt(fullHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    };
  }
  const match = trimmed.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/);
  if (match) {
    return {
      r: parseFloat(match[1]) || 0,
      g: parseFloat(match[2]) || 0,
      b: parseFloat(match[3]) || 0,
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: RGBAColor, c2: RGBAColor, t: number): RGBAColor {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
    a: lerp(c1.a, c2.a, t),
  };
}

function toRgba(c: RGBAColor, alphaOverride?: number): string {
  const alpha = alphaOverride !== undefined ? alphaOverride : c.a;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function toPrefix(c: RGBAColor): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, `;
}

function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function cubicEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface CyberNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  pulsePhase: number;
  pulseSpeed: number;
  isCrimsonHub: boolean;
}

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  depth: number; // 0.1 (distant, small) to 1.0 (foreground, bright)
  twinklePhase: number;
  twinkleSpeed: number;
  baseAlpha: number;
  isPulsar: boolean;
  colorType: 'theme' | 'accent' | 'white';
}

interface ThemeTransitionState {
  isTransitioning: boolean;
  startTime: number;
  duration: number; // in milliseconds (e.g. 1400ms)
  fromConfig: SpaceThemeConfig;
  toConfig: SpaceThemeConfig;
}

interface SpaceCanvasStarfieldProps {
  state?: AIStateMode;
  theme?: SpaceThemeId;
  className?: string;
  enableInteractiveWaves?: boolean;
}

export const SpaceCanvasStarfield: React.FC<SpaceCanvasStarfieldProps> = ({
  state = 'IDLE',
  theme = 'CRIMSON_NEBULA',
  className = '',
  enableInteractiveWaves = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<AIStateMode>(state);
  const themeRef = useRef<SpaceThemeId>(theme);

  // Transition management
  const transitionRef = useRef<ThemeTransitionState>({
    isTransitioning: false,
    startTime: 0,
    duration: 1400,
    fromConfig: SPACE_THEME_CATALOG[theme] || SPACE_THEME_CATALOG.CRIMSON_NEBULA,
    toConfig: SPACE_THEME_CATALOG[theme] || SPACE_THEME_CATALOG.CRIMSON_NEBULA,
  });

  // Track state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Handle smooth theme transitions
  useEffect(() => {
    if (themeRef.current !== theme) {
      const prevThemeId = themeRef.current;
      const fromConfig = SPACE_THEME_CATALOG[prevThemeId] || SPACE_THEME_CATALOG.CRIMSON_NEBULA;
      const toConfig = SPACE_THEME_CATALOG[theme] || SPACE_THEME_CATALOG.CRIMSON_NEBULA;

      transitionRef.current = {
        isTransitioning: true,
        startTime: performance.now(),
        duration: 1400, // Cinematic 1.4-second warp transition
        fromConfig,
        toConfig,
      };

      themeRef.current = theme;
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial mount fade-in timer
    const mountStartTime = performance.now();
    const mountFadeDuration = 1200; // 1.2s smooth emergence

    let nodes: CyberNode[] = [];
    let stars: StarParticle[] = [];

    // Initialize cosmic particles (twinkling starfield + cyber matrix nodes)
    const initSpaceObjects = () => {
      // 1. Celestial background stars
      const starCount = Math.min(220, Math.max(110, Math.floor((width * height) / 9500)));
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const depth = Math.random() * 0.9 + 0.1;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.08 * depth,
          vy: -0.04 * depth - Math.random() * 0.04 * depth,
          baseRadius: depth > 0.8 ? 1.6 + Math.random() * 0.7 : depth > 0.4 ? 0.9 + Math.random() * 0.5 : 0.5 + Math.random() * 0.4,
          depth,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.8 + Math.random() * 2.2,
          baseAlpha: 0.25 + depth * 0.55,
          isPulsar: i % 16 === 0,
          colorType: i % 6 === 0 ? 'theme' : i % 9 === 0 ? 'accent' : 'white',
        });
      }

      // 2. Cyber Grid Nodes
      const count = Math.min(80, Math.max(40, Math.floor((width * height) / 24000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        const isHub = i % 7 === 0;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          baseRadius: isHub ? 2.6 : 1.3,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 2.0 + 1.0,
          isCrimsonHub: isHub,
        });
      }
    };

    initSpaceObjects();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initSpaceObjects();
    };

    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    let scanlineY = 0;
    let waveOffset = 0;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      waveOffset += dt * 1.2;

      // 0. Calculate Initial Mount Fade-In
      const mountProgress = Math.min(1, (time - mountStartTime) / mountFadeDuration);
      const mountFadeAlpha = cubicEaseOut(mountProgress);

      // 1. Calculate Active Theme Transition / Interpolation
      const transition = transitionRef.current;
      let t = 1;
      let warpIntensity = 0;
      let activeBg: RGBAColor;
      let activeGlow: RGBAColor;
      let activeAlert: RGBAColor;
      let activeConduitHub: RGBAColor;
      let activeConduitNormal: RGBAColor;
      let activePacket: RGBAColor;
      let activeScanline: RGBAColor;
      let activePrimary: RGBAColor;
      let activeAccent: RGBAColor;
      let activeTargetThemeName = transition.toConfig.name;
      let activeTargetShortLabel = transition.toConfig.shortLabel;

      if (transition.isTransitioning) {
        const rawProgress = Math.min(1, (time - transition.startTime) / transition.duration);
        t = cubicEaseInOut(rawProgress);
        // Warp curve peaks midway through transition (0 -> 1 -> 0)
        warpIntensity = Math.sin(rawProgress * Math.PI);

        const from = transition.fromConfig;
        const to = transition.toConfig;

        activeBg = lerpColor(parseColor(from.bgHex), parseColor(to.bgHex), t);
        activeGlow = lerpColor(parseColor(from.ambientGlow), parseColor(to.ambientGlow), t);
        activeAlert = lerpColor(parseColor(from.ambientAlert), parseColor(to.ambientAlert), t);
        activeConduitHub = lerpColor(parseColor(from.conduitHubPrefix), parseColor(to.conduitHubPrefix), t);
        activeConduitNormal = lerpColor(parseColor(from.conduitNormalPrefix), parseColor(to.conduitNormalPrefix), t);
        activePacket = lerpColor(parseColor(from.packetColor), parseColor(to.packetColor), t);
        activeScanline = lerpColor(parseColor(from.scanlineRgba), parseColor(to.scanlineRgba), t);
        activePrimary = lerpColor(parseColor(from.primaryColor), parseColor(to.primaryColor), t);
        activeAccent = lerpColor(parseColor(from.accentColor), parseColor(to.accentColor), t);

        if (rawProgress >= 1) {
          transition.isTransitioning = false;
        }
      } else {
        const cfg = SPACE_THEME_CATALOG[themeRef.current] || SPACE_THEME_CATALOG.CRIMSON_NEBULA;
        activeBg = parseColor(cfg.bgHex);
        activeGlow = parseColor(cfg.ambientGlow);
        activeAlert = parseColor(cfg.ambientAlert);
        activeConduitHub = parseColor(cfg.conduitHubPrefix);
        activeConduitNormal = parseColor(cfg.conduitNormalPrefix);
        activePacket = parseColor(cfg.packetColor);
        activeScanline = parseColor(cfg.scanlineRgba);
        activePrimary = parseColor(cfg.primaryColor);
        activeAccent = parseColor(cfg.accentColor);
        activeTargetThemeName = cfg.name;
        activeTargetShortLabel = cfg.shortLabel;
      }

      const currentState = stateRef.current;
      const isFast = currentState === 'THINKING' || currentState === 'EXECUTING';
      const isAlert = currentState === 'SECURITY_ALERT';

      scanlineY = (scanlineY + dt * 45) % height;

      // 2. DEEP SPACE CANVAS BACKGROUND (Color-Interpolated)
      ctx.fillStyle = toRgba(activeBg, 1);
      ctx.fillRect(0, 0, width, height);

      // 3. SUBTLE RADIAL AMBIENT NEBULA GLOW
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        40,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      const ambientTarget = isAlert ? activeAlert : activeGlow;
      grad.addColorStop(0, toRgba(ambientTarget, ambientTarget.a * mountFadeAlpha));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 4. CINEMATIC HYPERSPACE SHOCKWAVE / WARP RIPPLE
      if (warpIntensity > 0.005) {
        const maxRadius = Math.hypot(width, height) * 0.72;
        const waveRadius = t * maxRadius;
        const waveThickness = 50 + warpIntensity * 90;

        const waveGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.max(0, waveRadius - waveThickness),
          width * 0.5,
          height * 0.5,
          waveRadius + waveThickness
        );
        waveGrad.addColorStop(0, toRgba(activePrimary, 0));
        waveGrad.addColorStop(0.5, toRgba(activePrimary, warpIntensity * 0.22 * mountFadeAlpha));
        waveGrad.addColorStop(1, toRgba(activePrimary, 0));

        ctx.fillStyle = waveGrad;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, waveRadius + waveThickness, 0, Math.PI * 2);
        ctx.fill();

        // High-energy leading shockwave line
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = toRgba(activeAccent, warpIntensity * 0.42 * mountFadeAlpha);
        ctx.lineWidth = 1.5 + warpIntensity * 2;
        ctx.stroke();
      }

      // 5. CELESTIAL BACKGROUND STARFIELD WITH DRIFT & PARALLAX
      const warpSpeedMult = 1.0 + (isFast ? 1.4 : 0) + warpIntensity * 3.2;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Particle motion update
        star.x += star.vx * warpSpeedMult;
        star.y += star.vy * warpSpeedMult;

        // Boundary wrap
        if (star.x < 0) star.x = width;
        else if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        else if (star.y > height) star.y = 0;

        star.twinklePhase += dt * star.twinkleSpeed * (1 + warpIntensity * 1.5);
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2;

        const alpha = Math.min(
          1,
          Math.max(0.05, (star.baseAlpha * 0.6 + twinkle * 0.4 + warpIntensity * 0.25) * mountFadeAlpha)
        );

        let starColorRgba: string;
        if (star.colorType === 'theme') {
          starColorRgba = toRgba(activePrimary, alpha);
        } else if (star.colorType === 'accent') {
          starColorRgba = toRgba(activeAccent, alpha);
        } else {
          // Soft white with faint theme tint
          const whiteTint = lerpColor({ r: 240, g: 248, b: 255, a: 1 }, activePrimary, 0.15);
          starColorRgba = toRgba(whiteTint, alpha);
        }

        const radius = star.baseRadius * (1 + (warpIntensity * 0.4));

        // Draw star core
        ctx.fillStyle = starColorRgba;
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Warp Streak Effect during high-speed sector transition
        if (warpIntensity > 0.08 && star.depth > 0.5) {
          const streakLen = warpIntensity * (star.depth * 14 + 3);
          ctx.beginPath();
          ctx.moveTo(star.x - star.vx * streakLen, star.y - star.vy * streakLen);
          ctx.lineTo(star.x, star.y);
          ctx.strokeStyle = toRgba(activeAccent, alpha * 0.6);
          ctx.lineWidth = Math.max(0.8, radius * 0.8);
          ctx.stroke();
        }

        // Rare Pulsar diffraction lens flare
        if (star.isPulsar && twinkle > 0.7 && star.depth > 0.6) {
          const flareLen = (radius + 3.5) * (0.8 + twinkle * 0.8);
          ctx.strokeStyle = toRgba(activeAccent, alpha * 0.45);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(star.x - flareLen, star.y);
          ctx.lineTo(star.x + flareLen, star.y);
          ctx.moveTo(star.x, star.y - flareLen);
          ctx.lineTo(star.x, star.y + flareLen);
          ctx.stroke();
        }
      }

      // 6. CYBERNETIC CIRCUIT CONDUITS (Interpolated Palette)
      if (enableInteractiveWaves) {
        ctx.save();
        const maxDist = isFast ? 165 : 125;
        const maxDistSq = maxDist * maxDist;

        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              const dist = Math.sqrt(distSq);
              const normDist = 1 - dist / maxDist;

              const conduitPulse = (Math.sin(waveOffset * 3.0 + (n1.x + n2.y) * 0.015) + 1) / 2;
              const alpha = Math.max(0.02, normDist * (0.18 + conduitPulse * 0.22) * mountFadeAlpha);

              const isHubLine = n1.isCrimsonHub || n2.isCrimsonHub;
              const strokeColor = isHubLine
                ? toRgba(activeConduitHub, alpha)
                : toRgba(activeConduitNormal, alpha * 0.7);

              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = normDist > 0.6 ? 1.0 : 0.6;

              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();

              // Moving digital data bit packet along conduit
              if (conduitPulse > 0.88 && normDist > 0.4) {
                const packetT = (conduitPulse - 0.88) / 0.12;
                const px = n1.x + dx * packetT;
                const py = n1.y + dy * packetT;
                ctx.fillStyle = toRgba(activePacket, 0.95 * mountFadeAlpha);
                ctx.beginPath();
                ctx.arc(px, py, 1.3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
        ctx.restore();
      }

      // 7. CYBER NODES UPDATE & DRAW
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        const nodeSpeed = (isFast ? 1.6 : 1.0) + warpIntensity * 1.5;
        n.x += n.vx * nodeSpeed;
        n.y += n.vy * nodeSpeed;

        // Wrap around boundaries
        if (n.x < 0) n.x = width;
        else if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        else if (n.y > height) n.y = 0;

        n.pulsePhase += dt * n.pulseSpeed;
        const pulse = (Math.sin(n.pulsePhase) + 1) / 2;
        const currentRadius = n.baseRadius + pulse * 0.8;

        const nodeAlpha = (0.4 + pulse * 0.4) * mountFadeAlpha;
        ctx.fillStyle = n.isCrimsonHub
          ? toRgba(activeConduitHub, (0.6 + pulse * 0.4) * mountFadeAlpha)
          : `rgba(148, 163, 184, ${nodeAlpha * 0.75})`;

        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        if (n.isCrimsonHub) {
          ctx.strokeStyle = toRgba(activeConduitHub, (0.25 + pulse * 0.25) * mountFadeAlpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, currentRadius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 8. SUBTLE LASER SCANLINE SWEEP
      ctx.fillStyle = toRgba(activeScanline, activeScanline.a * mountFadeAlpha);
      ctx.fillRect(0, scanlineY, width, 2);

      // 9. CINEMATIC SECTOR WARP TELEMETRY (Subtle sci-fi HUD display on theme transition)
      if (warpIntensity > 0.05 && mountFadeAlpha > 0.5) {
        const hudAlpha = Math.min(1, warpIntensity * 1.6);
        ctx.save();
        const bannerW = 340;
        const bannerH = 26;
        const bannerX = (width - bannerW) / 2;
        const bannerY = 62; // Below TopBar

        // Subtle glowing dark pill backdrop
        ctx.fillStyle = `rgba(5, 7, 16, ${0.85 * hudAlpha})`;
        ctx.strokeStyle = toRgba(activeAccent, 0.65 * hudAlpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 4);
        ctx.fill();
        ctx.stroke();

        // Corner tick accents
        ctx.fillStyle = toRgba(activePrimary, 0.9 * hudAlpha);
        ctx.fillRect(bannerX - 2, bannerY + 4, 2, bannerH - 8);
        ctx.fillRect(bannerX + bannerW, bannerY + 4, 2, bannerH - 8);

        // Transition telemetry label
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = toRgba(activeAccent, hudAlpha);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const progressPct = Math.round(t * 100);
        ctx.fillText(
          `✦ CELESTIAL SECTOR WARP: ${activeTargetShortLabel} // ${progressPct}%`,
          width * 0.5,
          bannerY + bannerH * 0.5 - 2
        );

        // Thin animated energy progress line inside banner
        const barPad = 24;
        const barY = bannerY + bannerH - 4;
        const barW = bannerW - barPad * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(bannerX + barPad, barY, barW, 2);
        ctx.fillStyle = toRgba(activePrimary, hudAlpha);
        ctx.fillRect(bannerX + barPad, barY, barW * t, 2);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [enableInteractiveWaves]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};
