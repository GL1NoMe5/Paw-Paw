import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';

export interface CozyLeafFallProps {
  className?: string;
  enabled?: boolean;
  isDark?: boolean;
}

export interface AutumnPuppyVignetteProps {
  className?: string;
  enabled?: boolean;
  isDark?: boolean;
}

type LeafParticleKind = 'maple' | 'oak' | 'heart';

interface LeafParticleSpec {
  id: string;
  kind: LeafParticleKind;
  leftPercent: number;
  size: number;
  opacity: number;
  swayPx: number;
  rotateStart: number;
  rotateDelta: number;
  duration: number;
  delay: number;
  tone: 'ochre' | 'terracotta' | 'sage' | 'gold' | 'coral';
}

// 10 delicate autumn maple/oak leaves + 2 tiny floating warm hearts hugging viewport edges
const FALL_PARTICLES: ReadonlyArray<LeafParticleSpec> = [
  {
    id: 'leaf-1',
    kind: 'maple',
    leftPercent: 2.5,
    size: 18,
    opacity: 0.36,
    swayPx: 18,
    rotateStart: -14,
    rotateDelta: 48,
    duration: 15.5,
    delay: 0.2,
    tone: 'terracotta',
  },
  {
    id: 'leaf-2',
    kind: 'oak',
    leftPercent: 6.8,
    size: 15,
    opacity: 0.3,
    swayPx: -14,
    rotateStart: 12,
    rotateDelta: -42,
    duration: 18.2,
    delay: 3.6,
    tone: 'ochre',
  },
  {
    id: 'leaf-3',
    kind: 'maple',
    leftPercent: 11.2,
    size: 14,
    opacity: 0.28,
    swayPx: 15,
    rotateStart: 20,
    rotateDelta: 55,
    duration: 14.0,
    delay: 7.4,
    tone: 'sage',
  },
  {
    id: 'heart-1',
    kind: 'heart',
    leftPercent: 4.5,
    size: 12,
    opacity: 0.32,
    swayPx: 12,
    rotateStart: -10,
    rotateDelta: 22,
    duration: 16.8,
    delay: 5.2,
    tone: 'coral',
  },
  {
    id: 'leaf-4',
    kind: 'oak',
    leftPercent: 14.5,
    size: 13,
    opacity: 0.29,
    swayPx: -12,
    rotateStart: -22,
    rotateDelta: 38,
    duration: 19.4,
    delay: 1.5,
    tone: 'gold',
  },
  {
    id: 'leaf-5',
    kind: 'maple',
    leftPercent: 85.5,
    size: 15,
    opacity: 0.3,
    swayPx: 14,
    rotateStart: 8,
    rotateDelta: -46,
    duration: 17.2,
    delay: 2.1,
    tone: 'gold',
  },
  {
    id: 'leaf-6',
    kind: 'maple',
    leftPercent: 90.2,
    size: 19,
    opacity: 0.38,
    swayPx: -18,
    rotateStart: -18,
    rotateDelta: 54,
    duration: 13.6,
    delay: 0.6,
    tone: 'terracotta',
  },
  {
    id: 'leaf-7',
    kind: 'oak',
    leftPercent: 94.5,
    size: 16,
    opacity: 0.34,
    swayPx: -15,
    rotateStart: 16,
    rotateDelta: -50,
    duration: 16.4,
    delay: 4.8,
    tone: 'ochre',
  },
  {
    id: 'heart-2',
    kind: 'heart',
    leftPercent: 92.6,
    size: 12,
    opacity: 0.33,
    swayPx: 11,
    rotateStart: 8,
    rotateDelta: -20,
    duration: 15.8,
    delay: 8.6,
    tone: 'coral',
  },
  {
    id: 'leaf-8',
    kind: 'maple',
    leftPercent: 97.0,
    size: 14,
    opacity: 0.31,
    swayPx: -13,
    rotateStart: -12,
    rotateDelta: 40,
    duration: 19.8,
    delay: 6.3,
    tone: 'sage',
  },
  {
    id: 'leaf-9',
    kind: 'oak',
    leftPercent: 88.0,
    size: 14,
    opacity: 0.28,
    swayPx: 16,
    rotateStart: 25,
    rotateDelta: -36,
    duration: 14.8,
    delay: 9.8,
    tone: 'terracotta',
  },
  {
    id: 'leaf-10',
    kind: 'maple',
    leftPercent: 8.6,
    size: 16,
    opacity: 0.33,
    swayPx: 14,
    rotateStart: -8,
    rotateDelta: 44,
    duration: 12.8,
    delay: 10.5,
    tone: 'gold',
  },
];

function LeafGlyph({
  kind,
  color,
  size,
}: {
  kind: LeafParticleKind;
  color: string;
  size: number;
}) {
  if (kind === 'heart') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 15.2 C4.6 12, 2.2 9.4, 2.2 6.6 C2.2 4.4, 3.9 2.8, 6 2.8 C7.4 2.8, 8.4 3.6, 9 4.8 C9.6 3.6, 10.6 2.8, 12 2.8 C14.1 2.8, 15.8 4.4, 15.8 6.6 C15.8 9.4, 13.4 12, 9 15.2 Z"
          fill={color}
        />
      </svg>
    );
  }

  if (kind === 'oak') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11 2 C13 2, 14 4.5, 13 6.2 C16 6, 17.5 8.8, 15 11.2 C18 12.2, 18 15.5, 14.5 17 C16 19.6, 14 22.2, 11.5 21.6 L11.5 25 L10.5 25 L10.5 21.6 C8 22.2, 6 19.6, 7.5 17 C4 15.5, 4 12.2, 7 11.2 C4.5 8.8, 6 6, 9 6.2 C8 4.5, 9 2, 11 2 Z"
          fill={color}
        />
        <path
          d="M11 5.5 L11 20.5"
          stroke="#fffaf3"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12.6 25 L11.4 25 L11.4 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z"
        fill={color}
      />
      <path
        d="M12 7 L12 19.5 M12 13.5 L8 10.5 M12 13.5 L16 10.5"
        stroke="#fffaf3"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/**
 * Lightweight, non-interactive edge-framed autumn leaf & tiny heart fall overlay.
 * Returns null when cozyAnimations is disabled or prefers-reduced-motion is active.
 */
export const CozyLeafFall: React.FC<CozyLeafFallProps> = ({
  className,
  enabled,
  isDark,
}) => {
  const storeAnimations = useDogStore((s) => s.cozyAnimations);
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const shouldReduceMotion = useReducedMotion();

  const isEnabled = enabled ?? storeAnimations;
  const dark = isDark ?? storeDark;

  if (!isEnabled || shouldReduceMotion) {
    return null;
  }

  const toneColors: Record<LeafParticleSpec['tone'], string> = dark
    ? {
        ochre: '#e09a4e',
        terracotta: '#dc7258',
        sage: '#73b089',
        gold: '#e8b658',
        coral: '#e57b72',
      }
    : {
        ochre: '#c4792d',
        terracotta: '#c4583d',
        sage: '#578767',
        gold: '#d49533',
        coral: '#d66056',
      };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none fixed inset-0 overflow-hidden z-10',
        className
      )}
    >
      {FALL_PARTICLES.map((item) => (
        <motion.div
          key={item.id}
          style={{
            position: 'absolute',
            left: `${item.leftPercent}%`,
            top: 0,
            willChange: 'transform, opacity',
          }}
          initial={{
            y: '-8vh',
            x: 0,
            rotate: item.rotateStart,
            opacity: 0,
          }}
          animate={{
            y: ['-8vh', '1.3vh', '52.3vh', '96.4vh', '108vh'],
            x: [0, item.swayPx * 0.55, item.swayPx, -item.swayPx * 0.65, 0],
            rotate: [
              item.rotateStart,
              item.rotateStart + item.rotateDelta * 0.14,
              item.rotateStart + item.rotateDelta * 0.62,
              item.rotateStart + item.rotateDelta * 0.9,
              item.rotateStart + item.rotateDelta,
            ],
            opacity: [0, item.opacity, item.opacity, item.opacity * 0.85, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.08, 0.52, 0.9, 1],
          }}
        >
          <LeafGlyph kind={item.kind} color={toneColors[item.tone]} size={item.size} />
        </motion.div>
      ))}
    </div>
  );
};

interface VignetteFallingLeaf {
  id: string;
  startX: number;
  startY: number;
  driftX: number;
  fallY: number;
  scale: number;
  rotateStart: number;
  rotateEnd: number;
  duration: number;
  delay: number;
  kind: 'maple' | 'oak';
  colorKey: 'terracotta' | 'ochre' | 'gold' | 'russet';
}

const VIGNETTE_LEAVES: ReadonlyArray<VignetteFallingLeaf> = [
  {
    id: 'vleaf-1',
    startX: 102,
    startY: 16,
    driftX: 7,
    fallY: 36,
    scale: 0.72,
    rotateStart: -15,
    rotateEnd: 20,
    duration: 5.2,
    delay: 0,
    kind: 'maple',
    colorKey: 'terracotta',
  },
  {
    id: 'vleaf-2',
    startX: 124,
    startY: 26,
    driftX: -8,
    fallY: 42,
    scale: 0.62,
    rotateStart: 18,
    rotateEnd: -16,
    duration: 6.1,
    delay: 1.4,
    kind: 'oak',
    colorKey: 'ochre',
  },
  {
    id: 'vleaf-3',
    startX: 84,
    startY: 10,
    driftX: 6,
    fallY: 34,
    scale: 0.58,
    rotateStart: -8,
    rotateEnd: 24,
    duration: 5.7,
    delay: 2.7,
    kind: 'maple',
    colorKey: 'gold',
  },
  {
    id: 'vleaf-4',
    startX: 24,
    startY: 22,
    driftX: -5,
    fallY: 40,
    scale: 0.64,
    rotateStart: 10,
    rotateEnd: -18,
    duration: 6.4,
    delay: 0.8,
    kind: 'oak',
    colorKey: 'russet',
  },
];

/**
 * Compact storybook vignette (~148x112px) of a fluffy golden puppy sitting in an
 * autumn leaf pile, gazing joyfully up at drifting orange & terracotta leaves.
 */
export const AutumnPuppyVignette: React.FC<AutumnPuppyVignetteProps> = ({
  className,
  enabled,
  isDark,
}) => {
  const storeAnimations = useDogStore((s) => s.cozyAnimations);
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const shouldReduceMotion = useReducedMotion();

  const isEnabled = enabled ?? storeAnimations;
  const shouldAnimate = isEnabled && !shouldReduceMotion;
  const dark = isDark ?? storeDark;
  const uid = useId().replace(/:/g, '');

  const c = dark
    ? {
        groundShadow: '#120e0c',
        furTop: '#f3cb88',
        furMid: '#e2a352',
        furDeep: '#bd7a2f',
        chestCream: '#fae1b3',
        ear: '#c57733',
        earInner: '#efb976',
        collar: '#c45242',
        tag: '#f4ca6f',
        blush: '#ef8f80',
        ink: '#311e14',
        leafColors: {
          terracotta: '#d9694c',
          ochre: '#e39949',
          gold: '#eab959',
          russet: '#b8543a',
          sage: '#6e9a78',
        },
      }
    : {
        groundShadow: '#dacab7',
        furTop: '#f7d493',
        furMid: '#e7a955',
        furDeep: '#c58034',
        chestCream: '#fce7be',
        ear: '#cb7b35',
        earInner: '#f1be7b',
        collar: '#c24e3e',
        tag: '#f5cc72',
        blush: '#f29384',
        ink: '#442b1d',
        leafColors: {
          terracotta: '#ce5c3f',
          ochre: '#de913f',
          gold: '#e7b04c',
          russet: '#a6482f',
          sage: '#699271',
        },
      };

  return (
    <svg
      width={148}
      height={112}
      viewBox="0 0 148 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0 overflow-visible select-none', className)}
    >
      <defs>
        <linearGradient id={`pup-fur-${uid}`} x1="52" y1="24" x2="88" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={c.furTop} />
          <stop offset="55%" stopColor={c.furMid} />
          <stop offset="100%" stopColor={c.furDeep} />
        </linearGradient>
      </defs>

      {/* Soft warm ground shadow under the leaf pile */}
      <ellipse
        cx="66"
        cy="99"
        rx="44"
        ry="7.5"
        fill={c.groundShadow}
        opacity={dark ? 0.45 : 0.6}
      />

      {/* Back layer of the autumn leaf pile */}
      <g>
        <g transform="translate(20, 77) rotate(-26)">
          <path
            d="M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12 24 L11 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z"
            fill={c.leafColors.russet}
            stroke={c.ink}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(82, 74) rotate(24)">
          <path
            d="M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12 24 L11 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z"
            fill={c.leafColors.ochre}
            stroke={c.ink}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(94, 83) rotate(52) scale(0.85)">
          <path
            d="M11 2 C13 2, 14 4.5, 13 6.2 C16 6, 17.5 8.8, 15 11.2 C18 12.2, 18 15.5, 14.5 17 C16 19.6, 14 22.2, 11.5 21.6 L10.5 21.6 C8 22.2, 6 19.6, 7.5 17 C4 15.5, 4 12.2, 7 11.2 C4.5 8.8, 6 6, 9 6.2 C8 4.5, 9 2, 11 2 Z"
            fill={c.leafColors.sage}
            stroke={c.ink}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Fluffy Wagging Tail (pivots around base at 45, 84) */}
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '45px 84px' }}
        animate={shouldAnimate ? { rotate: [-7, 9, -7] } : undefined}
        transition={
          shouldAnimate
            ? { duration: 2.6, ease: 'easeInOut', repeat: Infinity }
            : undefined
        }
      >
        <path
          d="M46 84 C36 82, 29 74, 31 66 C32.5 61, 37 61, 39 65 C41 69, 43 74, 48 77 Z"
          fill={`url(#pup-fur-${uid})`}
          stroke={c.ink}
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Sitting Fluffy Golden Puppy Body */}
      <g>
        {/* Back haunch */}
        <path
          d="M43 81 C42 71, 48 63, 55 60 L77 60 C84 65, 88 74, 86 86 C85 92, 78 96, 65 96 C51 96, 43 90, 43 81 Z"
          fill={`url(#pup-fur-${uid})`}
          stroke={c.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Fluffy cream chest ruff */}
        <path
          d="M58 63 C54 70, 55 81, 63 87 C72 86, 79 79, 79 66 C74 62, 65 61, 58 63 Z"
          fill={c.chestCream}
        />
        {/* Sitting left back paw peeking out */}
        <ellipse
          cx="49"
          cy="91"
          rx="6.2"
          ry="4"
          fill={c.chestCream}
          stroke={c.ink}
          strokeWidth="1.4"
        />
        {/* Cozy front legs & paws resting in leaf pile */}
        <path
          d="M58 76 C57 83, 56 89, 57 93 C57 96, 63 96.5, 64.5 93.5 C66 90, 66 83, 66 76"
          fill={c.furTop}
          stroke={c.ink}
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M72 75 C72 82, 72 89, 73 93 C73.5 96, 79.5 96, 80.5 93 C81.5 89, 80 82, 78.5 75"
          fill={c.furTop}
          stroke={c.ink}
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Terracotta collar & tiny brass tag */}
        <path
          d="M54 61 Q67 67 80 60 L81 64.5 Q67 71.5 53 65 Z"
          fill={c.collar}
          stroke={c.ink}
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
        <circle
          cx="71.5"
          cy="69.5"
          r="3.2"
          fill={c.tag}
          stroke={c.ink}
          strokeWidth="1.2"
        />
      </g>

      {/* Puppy Head Looking Joyfully Upward (gentle head tilt around 65, 58) */}
      <motion.g
        style={{ transformBox: 'view-box', transformOrigin: '65px 58px' }}
        animate={shouldAnimate ? { rotate: [-1.8, 2.2, -1.8] } : undefined}
        transition={
          shouldAnimate
            ? { duration: 5.2, ease: 'easeInOut', repeat: Infinity }
            : undefined
        }
      >
        {/* Back/Right Floppy Ear lifted gently as pup looks up */}
        <path
          d="M77 38 C85 38, 90 46, 87 54 C84.5 58, 79 56, 77 48 Z"
          fill={c.ear}
          stroke={c.ink}
          strokeWidth="1.45"
          strokeLinejoin="round"
        />

        {/* Head base */}
        <path
          d="M49 48 C48 36, 56 29, 67 29 C77.5 29, 85 35, 86.5 44 C88 49, 85 57, 77 59.5 C71 61.5, 62 61.5, 55.5 58.5 C51 56.5, 49.5 52.5, 49 48 Z"
          fill={`url(#pup-fur-${uid})`}
          stroke={c.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Fluffy forehead tuft */}
        <path
          d="M62 29.5 C63.5 25.5, 66 25.5, 67.5 28.5 C69.5 26, 71.5 27, 71.5 29.5"
          fill={c.furTop}
          stroke={c.ink}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Soft cream muzzle & happy cheeks */}
        <ellipse cx="74" cy="49.5" rx="9.5" ry="6.8" fill={c.chestCream} />
        <ellipse cx="62" cy="50.5" rx="3" ry="1.8" fill={c.blush} opacity="0.55" />
        <ellipse cx="81.5" cy="49.5" rx="2.4" ry="1.5" fill={c.blush} opacity="0.5" />

        {/* Joyful upward-gazing eyes + occasional smooth blink */}
        <g>
          <circle cx="65.5" cy="41.2" r="2.2" fill={c.ink} />
          <circle cx="66.3" cy="40.3" r="0.8" fill="#fffcf8" />
          <circle cx="77.5" cy="40.2" r="2.1" fill={c.ink} />
          <circle cx="78.3" cy="39.3" r="0.78" fill="#fffcf8" />

          {shouldAnimate && (
            <>
              <motion.ellipse
                cx="65.5"
                cy="41.2"
                rx="2.6"
                ry="2.5"
                fill={c.furMid}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                animate={{ scaleY: [0, 0, 1, 0, 0] }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.91, 0.945, 0.98, 1],
                }}
              />
              <motion.ellipse
                cx="77.5"
                cy="40.2"
                rx="2.5"
                ry="2.4"
                fill={c.furMid}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                animate={{ scaleY: [0, 0, 1, 0, 0] }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.91, 0.945, 0.98, 1],
                }}
              />
            </>
          )}
        </g>

        {/* Happy upturned puppy nose & warm smile */}
        <ellipse cx="77" cy="46.2" rx="2.7" ry="1.9" fill={c.ink} />
        <ellipse cx="76.3" cy="45.6" rx="0.9" ry="0.45" fill="#fffcf8" opacity="0.6" />
        <path
          d="M72.5 50.5 Q75.5 53 78.5 50.8"
          stroke={c.ink}
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Front/Left Floppy Ear with soft gentle sway */}
        <motion.path
          d="M52 38 C44 40, 42 52, 47 57 C50.5 59.5, 55 54, 54.5 44 Z"
          fill={c.ear}
          stroke={c.ink}
          strokeWidth="1.45"
          strokeLinejoin="round"
          style={{ transformBox: 'view-box', transformOrigin: '53px 40px' }}
          animate={shouldAnimate ? { rotate: [-2.5, 3, -2.5] } : undefined}
          transition={
            shouldAnimate
              ? { duration: 4.2, ease: 'easeInOut', repeat: Infinity }
              : undefined
          }
        />
      </motion.g>

      {/* Foreground Autumn Leaves nestled around puppy's paws */}
      <g>
        <g transform="translate(32, 86) rotate(-14) scale(0.92)">
          <path
            d="M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12 24 L11 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z"
            fill={c.leafColors.terracotta}
            stroke={c.ink}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(56, 87) rotate(32) scale(0.76)">
          <path
            d="M11 2 C13 2, 14 4.5, 13 6.2 C16 6, 17.5 8.8, 15 11.2 C18 12.2, 18 15.5, 14.5 17 C16 19.6, 14 22.2, 11.5 21.6 L10.5 21.6 C8 22.2, 6 19.6, 7.5 17 C4 15.5, 4 12.2, 7 11.2 C4.5 8.8, 6 6, 9 6.2 C8 4.5, 9 2, 11 2 Z"
            fill={c.leafColors.gold}
            stroke={c.ink}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(78, 84) rotate(18) scale(0.9)">
          <path
            d="M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12 24 L11 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z"
            fill={c.leafColors.terracotta}
            stroke={c.ink}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
      </g>

      {/* 4 Drifting Orange / Terracotta Leaves the puppy gazes up at */}
      {VIGNETTE_LEAVES.map((leaf) => {
        const leafFill = c.leafColors[leaf.colorKey];
        const pathD =
          leaf.kind === 'maple'
            ? 'M12 2 L14.2 8.2 L20.5 6.4 L17.6 12.4 L23 15.6 L16.6 18 L18 22.2 L12.6 20 L12 24 L11 20 L6 22.2 L7.4 18 L1 15.6 L6.4 12.4 L3.5 6.4 L9.8 8.2 Z'
            : 'M11 2 C13 2, 14 4.5, 13 6.2 C16 6, 17.5 8.8, 15 11.2 C18 12.2, 18 15.5, 14.5 17 C16 19.6, 14 22.2, 11.5 21.6 L10.5 21.6 C8 22.2, 6 19.6, 7.5 17 C4 15.5, 4 12.2, 7 11.2 C4.5 8.8, 6 6, 9 6.2 C8 4.5, 9 2, 11 2 Z';

        if (!shouldAnimate) {
          return (
            <g
              key={leaf.id}
              transform={`translate(${leaf.startX}, ${leaf.startY + 8}) rotate(${leaf.rotateStart}) scale(${leaf.scale})`}
              opacity={0.88}
            >
              <path
                d={pathD}
                fill={leafFill}
                stroke={c.ink}
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
            </g>
          );
        }

        return (
          <motion.g
            key={leaf.id}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            initial={{
              x: leaf.startX,
              y: leaf.startY - 6,
              rotate: leaf.rotateStart,
              scale: leaf.scale,
              opacity: 0,
            }}
            animate={{
              x: [
                leaf.startX,
                leaf.startX + leaf.driftX * 0.6,
                leaf.startX - leaf.driftX * 0.4,
                leaf.startX + leaf.driftX * 0.35,
              ],
              y: [
                leaf.startY - 6,
                leaf.startY + leaf.fallY * 0.16,
                leaf.startY + leaf.fallY * 0.82,
                leaf.startY + leaf.fallY,
              ],
              rotate: [
                leaf.rotateStart,
                leaf.rotateStart + (leaf.rotateEnd - leaf.rotateStart) * 0.22,
                leaf.rotateStart + (leaf.rotateEnd - leaf.rotateStart) * 0.84,
                leaf.rotateEnd,
              ],
              opacity: [0, 0.92, 0.92, 0],
            }}
            transition={{
              duration: leaf.duration,
              delay: leaf.delay,
              repeat: Infinity,
              ease: 'linear',
              times: [0, 0.16, 0.82, 1],
            }}
          >
            <path
              d={pathD}
              fill={leafFill}
              stroke={c.ink}
              strokeWidth="1.15"
              strokeLinejoin="round"
            />
          </motion.g>
        );
      })}
    </svg>
  );
};
