import React, { useId } from 'react';
import type { SkillCategory } from '../../types';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';

export interface DisciplineEmblemItemProps {
  size?: number;
  isDark?: boolean;
  className?: string;
}

export interface DisciplineEmblemProps extends DisciplineEmblemItemProps {
  category: SkillCategory;
}

function useSafeSvgId(prefix: string): string {
  const raw = useId().replace(/:/g, '');
  return `${prefix}-${raw}`;
}

/**
 * ОКД: Illustrated human hand and fluffy golden dog paw touching around a warm coral heart.
 */
export const OkdEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('okd');

  const p = dark
    ? {
        bg: '#242e26',
        ring: '#3b4e3f',
        innerRing: '#506b55',
        halo: '#e87864',
        sleeve: '#497d60',
        sleeveFold: '#6aa183',
        skin: '#f2c1a4',
        skinShadow: '#da9e7c',
        furMain: '#e5b162',
        furLight: '#f8dba0',
        furDeep: '#be8336',
        pawPad: '#9c5f4e',
        ink: '#2d1c13',
        sparkle: '#e8ba6c',
      }
    : {
        bg: '#eef4ed',
        ring: '#c5d9c4',
        innerRing: '#a2bf9f',
        halo: '#ef8b78',
        sleeve: '#3e7355',
        sleeveFold: '#629a7b',
        skin: '#f8cfb4',
        skinShadow: '#e7ad8b',
        furMain: '#eab767',
        furLight: '#fbe2ad',
        furDeep: '#c88c3d',
        pawPad: '#a66553',
        ink: '#442b1d',
        sparkle: '#d99945',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
        <linearGradient id={`${uid}-heart`} x1="34" y1="22" x2="58" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f07e69" />
          <stop offset="100%" stopColor="#c74838" />
        </linearGradient>
        <linearGradient id={`${uid}-fur`} x1="48" y1="42" x2="78" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.furLight} />
          <stop offset="55%" stopColor={p.furMain} />
          <stop offset="100%" stopColor={p.furDeep} />
        </linearGradient>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />
      <circle
        cx="46"
        cy="46"
        r="37"
        stroke={p.innerRing}
        strokeWidth="1"
        strokeDasharray="2.5 3.5"
        opacity="0.7"
      />

      {/* Warm coral aura behind heart */}
      <circle cx="46" cy="34" r="15" fill={p.halo} opacity={dark ? 0.16 : 0.2} />

      {/* Warm Coral Heart nestled between hand and paw */}
      <path
        d="M46 47.5 C36.5 40.5, 31 34, 31 28.5 C31 24.2, 34.5 21, 38.8 21 C41.9 21, 44.5 22.8, 46 25.4 C47.5 22.8, 50.1 21, 53.2 21 C57.5 21, 61 24.2, 61 28.5 C61 34, 55.5 40.5, 46 47.5 Z"
        fill={`url(#${uid}-heart)`}
        stroke={p.ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M35.5 27.5 C35.8 25.2, 37.8 24, 39.8 24.3"
        stroke="#fff8f4"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Clipped Hand & Paw Group */}
      <g clipPath={`url(#${uid}-clip)`}>
        {/* Human Hand (left reaching up-right) */}
        <path
          d="M17 70 L28 57 C30 54.5, 31.5 51, 32 47 C32.5 43.5, 35.5 41.5, 38.5 43 C40.5 44, 41 47, 40.5 49.5 L44 43.5 C45.2 41.8, 47.8 42.2, 48.2 44.3 L45.5 52 L48 48.2 C49.3 46.8, 51.3 47.8, 50.8 49.8 L46 57.5 C43.5 61.5, 39 64.5, 34.5 66.5 L25 78 Z"
          fill={p.skin}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        {/* Soft palm crease */}
        <path
          d="M33 56.5 C35.5 55, 38 55.5, 39.8 57.5"
          stroke={p.skinShadow}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Sage sleeve cuff */}
        <path
          d="M8 77 L21 63 L31 73 L18 87 Z"
          fill={p.sleeve}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 66 L27.5 75"
          stroke={p.sleeveFold}
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Fluffy Golden Dog Paw (right reaching up-left) */}
        <path
          d="M78 79 L65 65 C64 67, 61 66.5, 60.5 64 C58.5 65, 56 63.5, 56 61 C52.5 60.5, 49.5 58, 47.5 54.5 C45 50.2, 46.2 45, 50.2 43.2 C52.5 42.2, 55.2 42.5, 57.2 44.2 C59 43, 62 43.5, 63.8 46 C65.8 46, 68 48, 68 51 C70.5 52.5, 72.5 55.5, 72 58.5 L86 71 Z"
          fill={`url(#${uid}-fur)`}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        {/* Fluffy paw toes & warm paw pad */}
        <ellipse
          cx="53.5"
          cy="52.5"
          rx="3.4"
          ry="2.6"
          transform="rotate(-24 53.5 52.5)"
          fill={p.pawPad}
          opacity="0.88"
        />
        <path
          d="M52.5 44 C53 46.5, 54.5 48, 56.5 48.5 M58.5 45 C59 47.5, 60.8 49.2, 62.5 49.5"
          stroke={p.ink}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M64 58 C67 57, 69 59, 68.5 61.5"
          stroke={p.furLight}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      {/* Joyful warm sparkles */}
      <path
        d="M25 23 L26.2 25.8 L29 27 L26.2 28.2 L25 31 L23.8 28.2 L21 27 L23.8 25.8 Z"
        fill={p.sparkle}
        opacity="0.85"
      />
      <circle cx="67.5" cy="24.5" r="1.5" fill={p.sparkle} opacity="0.75" />
    </svg>
  );
};

/**
 * ЗКС: Noble, alert warm-amber hound portrait in a burgundy/terracotta collar with round tag.
 */
export const ZksEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('zks');

  const p = dark
    ? {
        bg: '#2c231c',
        ring: '#564333',
        innerRing: '#785c45',
        crest: '#3c2f25',
        amberMain: '#d99148',
        amberDeep: '#b36b2c',
        creamRuff: '#f5dab0',
        innerEar: '#ebb97b',
        muzzleShade: '#76492d',
        collarTop: '#bc493c',
        collarBot: '#8b2e25',
        tagTop: '#f5ce77',
        tagBot: '#c78c32',
        ink: '#2d1c13',
      }
    : {
        bg: '#f6ece0',
        ring: '#dfc7ad',
        innerRing: '#caa886',
        crest: '#ebd8c2',
        amberMain: '#dc9348',
        amberDeep: '#b86e2c',
        creamRuff: '#fae3bc',
        innerEar: '#f0c48a',
        muzzleShade: '#7e4e31',
        collarTop: '#b74236',
        collarBot: '#882b22',
        tagTop: '#f7d17b',
        tagBot: '#cc9135',
        ink: '#3f2618',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
        <linearGradient id={`${uid}-coat`} x1="28" y1="16" x2="66" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.amberMain} />
          <stop offset="100%" stopColor={p.amberDeep} />
        </linearGradient>
        <linearGradient id={`${uid}-collar`} x1="28" y1="56" x2="64" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.collarTop} />
          <stop offset="100%" stopColor={p.collarBot} />
        </linearGradient>
        <linearGradient id={`${uid}-tag`} x1="42" y1="64" x2="54" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.tagTop} />
          <stop offset="100%" stopColor={p.tagBot} />
        </linearGradient>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />
      <circle
        cx="46"
        cy="46"
        r="37"
        stroke={p.innerRing}
        strokeWidth="1"
        strokeDasharray="2.5 3.5"
        opacity="0.7"
      />

      {/* Subtle heraldic shield silhouette behind portrait */}
      <path
        d="M25 26 C25 22, 34 20, 46 20 C58 20, 67 22, 67 26 L67 49 C67 63, 46 73, 46 73 C46 73, 25 63, 25 49 Z"
        fill={p.crest}
        opacity="0.55"
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Shoulders & proud chest */}
        <path
          d="M22 86 C23 68, 29 58, 35 52 L57 52 C63 58, 69 68, 70 86 Z"
          fill={`url(#${uid}-coat)`}
          stroke={p.ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Fluffy cream chest ruff */}
        <path
          d="M36 58 L41 77 L46 73 L50 78 L56 59 Z"
          fill={p.creamRuff}
          stroke={p.ink}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Back upright alert ear */}
        <path
          d="M47 26 L56 13.5 C57.5 11.8, 59.8 12.8, 59.5 15.2 L58 31 Z"
          fill={p.amberDeep}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M51 25 L56.8 16.5 L56.5 27 Z" fill={p.innerEar} />

        {/* Noble Hound Head & Snout facing gently right */}
        <path
          d="M30 43 C29 33, 33 24, 42 23 C49 22.5, 55 26, 58 33 L68 37.5 C70.5 38.6, 70.5 42.8, 67.5 44.5 C64 46.5, 58.5 47.5, 55 47.5 C53.5 52.5, 51.5 56.5, 48 58 L33 56 C30.5 52, 30 47.5, 30 43 Z"
          fill={`url(#${uid}-coat)`}
          stroke={p.ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Muzzle dark saddle shading */}
        <path
          d="M52 36 C56 35, 62 36.2, 68 38.2 C69.5 39.5, 69.2 42.5, 67 44 C63 46, 57 46.5, 53 45.5 C50 44, 49.5 38.5, 52 36 Z"
          fill={p.muzzleShade}
          opacity="0.88"
        />

        {/* Front upright alert ear */}
        <path
          d="M31.5 34 L27.5 16.5 C27 14, 29.6 13, 31.2 14.8 L41.5 26.5 Z"
          fill={p.amberMain}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path d="M32.5 31 L30 18.5 L38 26.5 Z" fill={p.innerEar} />

        {/* Warm brow pip, focused dark eye & nose */}
        <ellipse cx="48.5" cy="30.5" rx="2.6" ry="1.3" transform="rotate(-10 48.5 30.5)" fill={p.creamRuff} />
        <circle cx="50.5" cy="34.5" r="2.3" fill={p.ink} />
        <circle cx="51.3" cy="33.7" r="0.8" fill="#fffcf8" />
        {/* Crisp nose & calm mouth */}
        <path
          d="M65.5 37.8 C67.5 37.4, 69.6 38.8, 69.2 40.8 C68.8 42.2, 66.5 42.5, 65 41.2 C64 40, 64.3 38.2, 65.5 37.8 Z"
          fill={p.ink}
        />
        <path
          d="M63.5 44.2 Q58.5 46 54.5 43.8"
          stroke={p.ink}
          strokeWidth="1.25"
          strokeLinecap="round"
        />

        {/* Burgundy / Terracotta Leather Collar */}
        <path
          d="M29 55.5 Q46 65.5 62.5 55.5 L64 61.5 Q46 72 27.5 61.5 Z"
          fill={`url(#${uid}-collar)`}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path
          d="M31.5 58.6 Q46 67 60.5 58.6"
          stroke="#f3a89c"
          strokeWidth="0.9"
          strokeDasharray="2 2.5"
          opacity="0.7"
        />
        {/* Brass buckle accent on collar left */}
        <rect
          x="33.5"
          y="57.5"
          width="4.2"
          height="5.2"
          rx="1.1"
          transform="rotate(14 35.6 60.1)"
          fill={p.tagTop}
          stroke={p.ink}
          strokeWidth="1"
        />

        {/* Hanging Round Brass Tag */}
        <circle cx="48" cy="64.2" r="2" fill="none" stroke={p.tagTop} strokeWidth="1.4" />
        <circle
          cx="48"
          cy="71"
          r="6.2"
          fill={`url(#${uid}-tag)`}
          stroke={p.ink}
          strokeWidth="1.4"
        />
        <circle cx="48" cy="71" r="4.1" stroke="#fff7df" strokeWidth="0.7" opacity="0.55" />
        {/* Tiny embossed paw dot inside tag */}
        <circle cx="48" cy="72" r="1.5" fill={p.ink} opacity="0.75" />
        <circle cx="46.2" cy="69.6" r="0.65" fill={p.ink} opacity="0.75" />
        <circle cx="48" cy="69" r="0.65" fill={p.ink} opacity="0.75" />
        <circle cx="49.8" cy="69.6" r="0.65" fill={p.ink} opacity="0.75" />
      </g>
    </svg>
  );
};

/**
 * Спорт: Happy smiling dog portrait + curved path of cozy paw prints & little crimson hearts.
 */
export const SportEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('sport');

  const p = dark
    ? {
        bg: '#2d2219',
        ring: '#584230',
        trailLine: '#7d5f47',
        pawTrail: '#d49464',
        heart: '#e4635c',
        furHead: '#efb96d',
        furCheek: '#fbe1b4',
        ear: '#b96e39',
        bandana: '#498f6d',
        bandanaHi: '#74bc99',
        tongue: '#eb7d83',
        blush: '#ef8f80',
        ink: '#2d1c13',
      }
    : {
        bg: '#fdf0e2',
        ring: '#ead0b4',
        trailLine: '#cfa884',
        pawTrail: '#b8764a',
        heart: '#d44c49',
        furHead: '#f2be71',
        furCheek: '#fde7c2',
        ear: '#bc703a',
        bandana: '#3e8161',
        bandanaHi: '#68ad8c',
        tongue: '#ed7d84',
        blush: '#f19284',
        ink: '#42291b',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />

      {/* Curved playful motion path */}
      <path
        d="M16 66 C28 80, 62 79, 75 56 C80 47, 79 34, 71 25"
        stroke={p.trailLine}
        strokeWidth="1.2"
        strokeDasharray="2.5 3.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Cozy Paw Prints along the lower curved arc */}
      <g transform="translate(20, 62) rotate(-25) scale(0.55)" fill={p.pawTrail}>
        <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
        <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" />
        <ellipse cx="7" cy="4" rx="1.8" ry="2.5" />
        <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" />
        <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" />
      </g>
      <g transform="translate(42, 70) rotate(6) scale(0.58)" fill={p.pawTrail}>
        <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
        <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" />
        <ellipse cx="7" cy="4" rx="1.8" ry="2.5" />
        <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" />
        <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" />
      </g>
      <g transform="translate(65, 58) rotate(40) scale(0.54)" fill={p.pawTrail}>
        <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
        <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" />
        <ellipse cx="7" cy="4" rx="1.8" ry="2.5" />
        <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" />
        <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" />
      </g>

      {/* Little Crimson Hearts along the energetic arc */}
      <path
        d="M17.5 45 C15.8 43, 12.5 44.2, 12.5 47 C12.5 49.8, 17.5 53.2, 17.5 53.2 C17.5 53.2, 22.5 49.8, 22.5 47 C22.5 44.2, 19.2 43, 17.5 45 Z"
        fill={p.heart}
      />
      <path
        d="M73.5 32.5 C71.8 30.5, 68.5 31.7, 68.5 34.5 C68.5 37.3, 73.5 40.7, 73.5 40.7 C73.5 40.7, 78.5 37.3, 78.5 34.5 C78.5 31.7, 75.2 30.5, 73.5 32.5 Z"
        fill={p.heart}
      />
      <path
        d="M65.5 21 C64.3 19.6, 62 20.5, 62 22.4 C62 24.4, 65.5 26.8, 65.5 26.8 C65.5 26.8, 69 24.4, 69 22.4 C69 20.5, 66.7 19.6, 65.5 21 Z"
        fill={p.heart}
        opacity="0.88"
      />

      {/* Happy Smiling Dog Portrait */}
      <g clipPath={`url(#${uid}-clip)`} transform="rotate(-4 45 40)">
        {/* Sporty collar & bandana knot */}
        <path
          d="M30 53 Q45 60 60 53 L62 63 Q45 71 28 63 Z"
          fill={p.bandana}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M41 61 L45 68 L49 61"
          fill={p.bandana}
          stroke={p.ink}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M33 56.5 Q45 62 57 56.5" stroke={p.bandanaHi} strokeWidth="1.2" opacity="0.8" />

        {/* Bouncy floppy ears */}
        <path
          d="M27 29 C19 31, 17 44, 22 48 C26 50, 30 43, 30 33 Z"
          fill={p.ear}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path
          d="M63 29 C71 31, 73 44, 68 48 C64 50, 60 43, 60 33 Z"
          fill={p.ear}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />

        {/* Rounded joyful head */}
        <path
          d="M27 37 C27 23, 35 17, 45 17 C55 17, 63 23, 63 37 C63 48, 56 56, 45 56 C34 56, 27 48, 27 37 Z"
          fill={p.furHead}
          stroke={p.ink}
          strokeWidth="1.6"
        />

        {/* Fluffy cream snout & forehead blaze */}
        <ellipse cx="45" cy="45.5" rx="12" ry="8.5" fill={p.furCheek} />
        <path d="M45 21 C43 26, 43 32, 45 36 C47 32, 47 26, 45 21 Z" fill={p.furCheek} />

        {/* Rosy joyful cheeks */}
        <ellipse cx="33.5" cy="42" rx="3.2" ry="2" fill={p.blush} opacity="0.58" />
        <ellipse cx="56.5" cy="42" rx="3.2" ry="2" fill={p.blush} opacity="0.58" />

        {/* Twinkling joyful eyes */}
        <circle cx="37.5" cy="34.5" r="2.4" fill={p.ink} />
        <circle cx="38.3" cy="33.7" r="0.85" fill="#fffcf8" />
        <circle cx="52.5" cy="34.5" r="2.4" fill={p.ink} />
        <circle cx="53.3" cy="33.7" r="0.85" fill="#fffcf8" />

        {/* Shiny nose */}
        <ellipse cx="45" cy="40.8" rx="3.4" ry="2.4" fill={p.ink} />
        <ellipse cx="44" cy="40" rx="1.1" ry="0.55" fill="#fffcf8" opacity="0.6" />

        {/* Open happy smile + cute pink tongue */}
        <path
          d="M41.5 46.5 C41.5 51.5, 48.5 51.5, 48.5 46.5 Z"
          fill={p.tongue}
          stroke={p.ink}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M39 44.5 Q42 47.5 45 45 Q48 47.5 51 44.5"
          fill="none"
          stroke={p.ink}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * Коррекция поведения: Calm sleeping dachshund & companion curled peacefully among meadow flowers.
 */
export const BehaviorEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('behavior');

  const p = dark
    ? {
        bg: '#272020',
        ring: '#503f3d',
        meadow: '#293a2e',
        meadowHi: '#395240',
        dachMain: '#b86c43',
        dachDeep: '#8c4c2b',
        dachTan: '#e2a372',
        pupCream: '#f1d8b1',
        pupApricot: '#d79660',
        heart: '#e67871',
        heartHalo: '#e67871',
        flowerPetal: '#f9f4eb',
        flowerCore: '#ebb346',
        leaf: '#6aa178',
        ink: '#2d1c13',
      }
    : {
        bg: '#f5ece9',
        ring: '#dfd0cb',
        meadow: '#d6e5d1',
        meadowHi: '#b9d1b3',
        dachMain: '#b8683f',
        dachDeep: '#8e4a29',
        dachTan: '#e3a271',
        pupCream: '#f8e2be',
        pupApricot: '#dc9a63',
        heart: '#e16c66',
        heartHalo: '#f09e98',
        flowerPetal: '#fffcf7',
        flowerCore: '#eeb545',
        leaf: '#5f966e',
        ink: '#432a1d',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />

      {/* Gentle Heart above sleeping pair */}
      <circle cx="46" cy="24" r="10.5" fill={p.heartHalo} opacity={dark ? 0.14 : 0.22} />
      <path
        d="M46 31.5 C40.5 27.5, 37.5 24, 37.5 20.8 C37.5 18.2, 39.6 16.4, 42 16.4 C43.8 16.4, 45.2 17.5, 46 19 C46.8 17.5, 48.2 16.4, 50 16.4 C52.4 16.4, 54.5 18.2, 54.5 20.8 C54.5 24, 51.5 27.5, 46 31.5 Z"
        fill={p.heart}
        stroke={p.ink}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Soft Meadow Grass Cushion */}
        <path
          d="M11 66 C18 52, 74 52, 81 66 C78 82, 62 88, 46 88 C30 88, 14 82, 11 66 Z"
          fill={p.meadow}
          stroke={p.meadowHi}
          strokeWidth="1.2"
        />

        {/* Sage grass blades behind */}
        <path
          d="M22 59 C20 53, 21 49, 23 47 M25 58 C25 53, 27 50, 29 49 M67 58 C69 52, 68 48, 66 46 M70 60 C72 55, 74 53, 76 52"
          stroke={p.leaf}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Sleeping Dachshund (left/center crescent) */}
        {/* Curled dachshund body */}
        <path
          d="M21 55 C20 41, 35 35, 51 39 C62 42, 67 51, 63 60 C59 68, 43 70, 29 67 C22 65, 21 60, 21 55 Z"
          fill={p.dachMain}
          stroke={p.ink}
          strokeWidth="1.5"
        />
        {/* Tucked dachshund tail */}
        <path
          d="M22 57 C23 64, 33 67, 40 65 C35 63, 27 61, 24 54 Z"
          fill={p.dachDeep}
          stroke={p.ink}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* Dachshund head resting calmly on left */}
        <path
          d="M25 46 C29 41, 38 41, 43 46 C46 50, 44 58, 37 59 C30 60, 22 57, 20 53 C19 50, 22 48, 25 46 Z"
          fill={p.dachMain}
          stroke={p.ink}
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
        {/* Tan cheeks, sleepy eye & draped ear */}
        <ellipse cx="26" cy="54" rx="4.5" ry="2.8" fill={p.dachTan} />
        <path
          d="M27 49 Q29.5 51.5 32 49"
          stroke={p.ink}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="20.5" cy="52" r="1.6" fill={p.ink} />
        <path
          d="M36 45 C40 46, 42 53, 38 56 C35 57, 33 52, 34 46 Z"
          fill={p.dachDeep}
          stroke={p.ink}
          strokeWidth="1.25"
        />

        {/* Smaller Cream Companion Curled Peacefully Beside Dachshund */}
        <path
          d="M44 59 C43 50, 52 44, 62 47 C69 49, 72 57, 68 64 C64 70, 51 70, 45 65 C44 63, 44 61, 44 59 Z"
          fill={p.pupCream}
          stroke={p.ink}
          strokeWidth="1.45"
        />
        {/* Companion head nestled sweetly */}
        <circle
          cx="54.5"
          cy="52"
          r="7.5"
          fill={p.pupCream}
          stroke={p.ink}
          strokeWidth="1.4"
        />
        {/* Soft apricot ear */}
        <path
          d="M59 47 C63 48, 65 54, 61.5 57 C59 58, 57 53, 57.5 48 Z"
          fill={p.pupApricot}
          stroke={p.ink}
          strokeWidth="1.2"
        />
        {/* Companion peaceful closed eye & tiny nose */}
        <path
          d="M50 51.5 Q52 53.5 54 51.5"
          stroke={p.ink}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="49" cy="54.5" r="1.4" fill={p.ink} />
        {/* Tiny tucked paw */}
        <ellipse
          cx="51"
          cy="63"
          rx="3.8"
          ry="2.2"
          fill={p.pupCream}
          stroke={p.ink}
          strokeWidth="1.15"
        />

        {/* Tiny Chamomile Meadow Flowers */}
        {[
          { x: 20, y: 66, s: 0.9 },
          { x: 34, y: 74, s: 1.0 },
          { x: 58, y: 74, s: 0.95 },
          { x: 72, y: 65, s: 0.85 },
        ].map((f, idx) => (
          <g key={idx} transform={`translate(${f.x}, ${f.y}) scale(${f.s})`}>
            <circle cx="0" cy="-3.2" r="2" fill={p.flowerPetal} />
            <circle cx="3" cy="-1" r="2" fill={p.flowerPetal} />
            <circle cx="1.9" cy="2.6" r="2" fill={p.flowerPetal} />
            <circle cx="-1.9" cy="2.6" r="2" fill={p.flowerPetal} />
            <circle cx="-3" cy="-1" r="2" fill={p.flowerPetal} />
            <circle cx="0" cy="0" r="1.8" fill={p.flowerCore} />
          </g>
        ))}
      </g>
    </svg>
  );
};

/**
 * Внимание: Alert attentive puppy looking toward a warm guiding star above a figure-eight path.
 */
export const AttentionEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('attention');

  const p = dark
    ? {
        bg: '#24271e',
        ring: '#4a523b',
        innerRing: '#687353',
        loopPath: '#6b7755',
        coatMain: '#e5b265',
        coatLight: '#f8deb0',
        coatDeep: '#bd8235',
        collar: '#4b8668',
        collarHi: '#6fb08f',
        star: '#f4c668',
        starGlow: '#f4c668',
        blush: '#ee8e7e',
        ink: '#2d1c13',
      }
    : {
        bg: '#f4f5e8',
        ring: '#d3d9b8',
        innerRing: '#b3bc8e',
        loopPath: '#bcc49a',
        coatMain: '#eab668',
        coatLight: '#fbe4b8',
        coatDeep: '#c5883b',
        collar: '#3e7355',
        collarHi: '#659e7d',
        star: '#e7a338',
        starGlow: '#f6cb6f',
        blush: '#f19484',
        ink: '#432a1d',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
        <linearGradient id={`${uid}-coat`} x1="24" y1="24" x2="62" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.coatLight} />
          <stop offset="55%" stopColor={p.coatMain} />
          <stop offset="100%" stopColor={p.coatDeep} />
        </linearGradient>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />
      <circle
        cx="46"
        cy="46"
        r="37"
        stroke={p.innerRing}
        strokeWidth="1"
        strokeDasharray="2.5 3.5"
        opacity="0.7"
      />

      {/* Subtle figure-eight / snake ribbon behind dog */}
      <path
        d="M17 65 C22 52, 34 54, 46 62 C58 70, 70 71, 75 58 C78 50, 69 44, 59 50"
        stroke={p.loopPath}
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Guiding Attention Star & Eye-Contact Beam */}
      <circle cx="66" cy="25" r="10.5" fill={p.starGlow} opacity={dark ? 0.16 : 0.24} />
      <path
        d="M66 15.5 L68.3 22 L75 24.3 L68.3 26.6 L66 33 L63.7 26.6 L57 24.3 L63.7 22 Z"
        fill={p.star}
        stroke={p.ink}
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="74.5" cy="17.5" r="1.4" fill={p.star} opacity="0.85" />
      <path
        d="M52 33 L58.5 28"
        stroke={p.star}
        strokeWidth="1.35"
        strokeDasharray="2 2.4"
        strokeLinecap="round"
        opacity="0.85"
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Cozy Neck & Collar */}
        <path
          d="M23 86 C25 69, 31 59, 38 56 L51 56 C57 60, 62 70, 63 86 Z"
          fill={`url(#${uid}-coat)`}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path
          d="M29 61 Q43 68 57 61 L59 66.5 Q43 74 27 66.5 Z"
          fill={p.collar}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M31 63.8 Q43 69.5 55 63.8" stroke={p.collarHi} strokeWidth="1.1" opacity="0.85" />

        {/* Back Upright Alert Ear */}
        <path
          d="M42 29 L49.5 16 C50.8 14, 53.5 14.8, 53.4 17.4 L52 33 Z"
          fill={p.coatDeep}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Attentive Puppy Head Looking Gently Right-Upward */}
        <path
          d="M24 44 C23.5 33, 29 25, 39 24.5 C47.5 24, 54 28.5, 56 36 L63 39 C65.2 40, 65.2 43.8, 62.6 45.4 C59.4 47.4, 54.5 48.2, 51.5 48.5 C50 53.2, 46.5 57, 41 58 C31 59.5, 24.5 52.5, 24 44 Z"
          fill={`url(#${uid}-coat)`}
          stroke={p.ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Cream Snout Highlight */}
        <ellipse cx="53.5" cy="43" rx="7.5" ry="5" fill={p.coatLight} opacity="0.9" />

        {/* Front Perked Alert Ear */}
        <path
          d="M27.5 34.5 L24 18 C23.5 15.6, 26.2 14.6, 28 16.5 L37.5 27.5 Z"
          fill={p.coatMain}
          stroke={p.ink}
          strokeWidth="1.55"
          strokeLinejoin="round"
        />
        <path d="M28.5 31.5 L26.5 20 L34 27.5 Z" fill={p.coatLight} opacity="0.8" />

        {/* Bright Attentive Eye Locked on Star + Nose & Smile */}
        <ellipse cx="45" cy="36.5" rx="2.7" ry="2.8" fill={p.ink} />
        <circle cx="45.9" cy="35.5" r="0.95" fill="#fffcf8" />
        <ellipse cx="38" cy="43.5" rx="3" ry="1.8" fill={p.blush} opacity="0.52" />
        <path
          d="M61 39.2 C62.8 38.8, 64.6 40.1, 64.2 41.8 C63.8 43, 61.8 43.2, 60.5 42.1 C59.6 41.1, 59.9 39.5, 61 39.2 Z"
          fill={p.ink}
        />
        <path
          d="M59 45 Q55.2 47 52 45"
          stroke={p.ink}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * Доверие: Calm trusting dog gently cradled by a caring hand beneath a warm coral heart.
 */
export const TrustEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('trust');

  const p = dark
    ? {
        bg: '#2c201e',
        ring: '#563f3b',
        innerRing: '#795a54',
        heartHalo: '#e8786d',
        heartTop: '#f28275',
        heartBot: '#c94c40',
        coatMain: '#e8c494',
        coatLight: '#faebd1',
        ear: '#bc7d49',
        blush: '#ec8c80',
        skin: '#f2c1a4',
        sleeve: '#497d60',
        sleeveFold: '#6aa183',
        ink: '#2d1c13',
      }
    : {
        bg: '#f9eee9',
        ring: '#e4c8bc',
        innerRing: '#cca495',
        heartHalo: '#f2958b',
        heartTop: '#f07b6d',
        heartBot: '#c94a3d',
        coatMain: '#ecd0a5',
        coatLight: '#fdf0d9',
        ear: '#c2834f',
        blush: '#f19388',
        skin: '#f8cfb4',
        sleeve: '#3e7355',
        sleeveFold: '#629a7b',
        ink: '#432a1d',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <clipPath id={`${uid}-clip`}>
          <circle cx="46" cy="46" r="40.5" />
        </clipPath>
        <linearGradient id={`${uid}-heart`} x1="38" y1="15" x2="54" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.heartTop} />
          <stop offset="100%" stopColor={p.heartBot} />
        </linearGradient>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />
      <circle
        cx="46"
        cy="46"
        r="37"
        stroke={p.innerRing}
        strokeWidth="1"
        strokeDasharray="2.5 3.5"
        opacity="0.7"
      />

      {/* Warm Trust Heart Above */}
      <circle cx="46" cy="23.5" r="10.5" fill={p.heartHalo} opacity={dark ? 0.16 : 0.24} />
      <path
        d="M46 31.5 C40.2 27.3, 37 23.8, 37 20.5 C37 17.8, 39.2 15.8, 41.8 15.8 C43.7 15.8, 45.2 17, 46 18.6 C46.8 17, 48.3 15.8, 50.2 15.8 C52.8 15.8, 55 17.8, 55 20.5 C55 23.8, 51.8 27.3, 46 31.5 Z"
        fill={`url(#${uid}-heart)`}
        stroke={p.ink}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {/* Soft Floppy Ears */}
        <path
          d="M27 39 C20 41, 18.5 53, 23 56.5 C26.5 58.5, 30 52, 30 42 Z"
          fill={p.ear}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M65 39 C72 41, 73.5 53, 69 56.5 C65.5 58.5, 62 52, 62 42 Z"
          fill={p.ear}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Calm Trusting Dog Head */}
        <path
          d="M28 46 C28 33.5, 35.5 29, 46 29 C56.5 29, 64 33.5, 64 46 C64 56.5, 56.5 64, 46 64 C35.5 64, 28 56.5, 28 46 Z"
          fill={p.coatMain}
          stroke={p.ink}
          strokeWidth="1.6"
        />

        {/* Cream Muzzle & Gentle Smile */}
        <ellipse cx="46" cy="54" rx="11.5" ry="7.8" fill={p.coatLight} />
        <ellipse cx="34.5" cy="50.5" rx="3.2" ry="1.9" fill={p.blush} opacity="0.55" />
        <ellipse cx="57.5" cy="50.5" rx="3.2" ry="1.9" fill={p.blush} opacity="0.55" />

        {/* Calm Closed Happy Trusting Eyes */}
        <path
          d="M36 44 Q38.5 41.5 41 44 M51 44 Q53.5 41.5 56 44"
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Shiny Nose & Relaxed Smile */}
        <ellipse cx="46" cy="49.5" rx="3.2" ry="2.2" fill={p.ink} />
        <path
          d="M41.5 54 Q43.8 56.5 46 54.5 Q48.2 56.5 50.5 54"
          stroke={p.ink}
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        {/* Tiny clean white teeth peek hint */}
        <path
          d="M43.2 55.2 L44.3 57 L45.5 55.2 M46.5 55.2 L47.7 57 L48.8 55.2"
          fill="#fffcf8"
          stroke={p.ink}
          strokeWidth="0.95"
          strokeLinejoin="round"
        />

        {/* Gentle Caring Human Hand Cradling Chin from Below-Left */}
        <path
          d="M17 75 L30 63 C33.5 60.5, 38 61.5, 42.5 63 L52.5 62.5 C55.2 62.5, 56 66.2, 53 67.5 L42 70.5 C38 71.5, 34 73, 29 76.5 L21 84 Z"
          fill={p.skin}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M9 79 L21 67 L30 76 L18 88 Z"
          fill={p.sleeve}
          stroke={p.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M19 69.5 L27 77.5"
          stroke={p.sleeveFold}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * Custom / Unknown Discipline: Warm glowing paw-with-heart medallion.
 */
export const CustomDisciplineEmblem: React.FC<DisciplineEmblemItemProps> = ({
  size = 84,
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const uid = useSafeSvgId('custom');

  const p = dark
    ? {
        bg: '#2b221c',
        ring: '#584434',
        glow: '#f0b66c',
        pawTop: '#dd8e52',
        pawBot: '#b35c37',
        pawHi: '#f4c58e',
        heartTop: '#f27c6e',
        heartBot: '#c7433a',
        sparkle: '#f0be6a',
        ink: '#2d1c13',
      }
    : {
        bg: '#fbf0e4',
        ring: '#e4cbb2',
        glow: '#f6c37b',
        pawTop: '#df8f53',
        pawBot: '#b85f39',
        pawHi: '#f8cfa0',
        heartTop: '#f0786a',
        heartBot: '#c84239',
        sparkle: '#d9953d',
        ink: '#442b1d',
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="54%" r="42%">
          <stop offset="0%" stopColor={p.glow} stopOpacity={dark ? 0.28 : 0.36} />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-paw`} x1="32" y1="24" x2="60" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.pawTop} />
          <stop offset="100%" stopColor={p.pawBot} />
        </linearGradient>
        <linearGradient id={`${uid}-heart`} x1="38" y1="45" x2="54" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.heartTop} />
          <stop offset="100%" stopColor={p.heartBot} />
        </linearGradient>
      </defs>

      {/* Medallion Backdrop */}
      <circle cx="46" cy="46" r="42" fill={p.bg} stroke={p.ring} strokeWidth="1.6" />
      <circle cx="46" cy="48" r="34" fill={`url(#${uid}-glow)`} />

      {/* 4 Plush Toe Beans */}
      <ellipse
        cx="25.5"
        cy="39.5"
        rx="5.2"
        ry="7"
        transform="rotate(-22 25.5 39.5)"
        fill={`url(#${uid}-paw)`}
        stroke={p.ink}
        strokeWidth="1.5"
      />
      <ellipse
        cx="38"
        cy="28.5"
        rx="5.4"
        ry="7.5"
        transform="rotate(-8 38 28.5)"
        fill={`url(#${uid}-paw)`}
        stroke={p.ink}
        strokeWidth="1.5"
      />
      <ellipse
        cx="54"
        cy="28.5"
        rx="5.4"
        ry="7.5"
        transform="rotate(8 54 28.5)"
        fill={`url(#${uid}-paw)`}
        stroke={p.ink}
        strokeWidth="1.5"
      />
      <ellipse
        cx="66.5"
        cy="39.5"
        rx="5.2"
        ry="7"
        transform="rotate(22 66.5 39.5)"
        fill={`url(#${uid}-paw)`}
        stroke={p.ink}
        strokeWidth="1.5"
      />

      {/* Main Plush Central Paw Pad */}
      <path
        d="M46 39 C35.5 39, 27 49, 27 59 C27 67.5, 34 72, 41 70.5 C43.5 70, 44.8 69.2, 46 69.2 C47.2 69.2, 48.5 70, 51 70.5 C58 72, 65 67.5, 65 59 C65 49, 56.5 39, 46 39 Z"
        fill={`url(#${uid}-paw)`}
        stroke={p.ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M32 54 C32.5 48.5, 36.5 44, 41.5 43"
        stroke={p.pawHi}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Glowing Warm Heart Inside the Paw Pad */}
      <path
        d="M46 64.8 C39.5 60, 35.8 55.6, 35.8 51.6 C35.8 48.4, 38.4 46, 41.5 46 C43.6 46, 45.2 47.2, 46 49 C46.8 47.2, 48.4 46, 50.5 46 C53.6 46, 56.2 48.4, 56.2 51.6 C56.2 55.6, 52.5 60, 46 64.8 Z"
        fill={`url(#${uid}-heart)`}
        stroke={p.ink}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M39 51 C39.2 49.4, 40.6 48.5, 42 48.8"
        stroke="#fff9f6"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Delicate Warm Sparkles */}
      <path
        d="M46 13 L47 15.6 L49.6 16.6 L47 17.6 L46 20.2 L45 17.6 L42.4 16.6 L45 15.6 Z"
        fill={p.sparkle}
      />
      <circle cx="20.5" cy="24.5" r="1.4" fill={p.sparkle} opacity="0.8" />
      <circle cx="71.5" cy="24.5" r="1.4" fill={p.sparkle} opacity="0.8" />
    </svg>
  );
};

/**
 * Dispatcher component mapping SkillCategory to its handcrafted storybook medallion.
 */
export const DisciplineEmblem: React.FC<DisciplineEmblemProps> = ({
  category,
  size = 84,
  isDark,
  className,
}) => {
  switch (category) {
    case 'okd':
      return <OkdEmblem size={size} isDark={isDark} className={className} />;
    case 'zks':
      return <ZksEmblem size={size} isDark={isDark} className={className} />;
    case 'sport':
      return <SportEmblem size={size} isDark={isDark} className={className} />;
    case 'behavior':
      return <BehaviorEmblem size={size} isDark={isDark} className={className} />;
    case 'attention':
      return <AttentionEmblem size={size} isDark={isDark} className={className} />;
    case 'trust':
      return <TrustEmblem size={size} isDark={isDark} className={className} />;
    default:
      return <CustomDisciplineEmblem size={size} isDark={isDark} className={className} />;
  }
};
