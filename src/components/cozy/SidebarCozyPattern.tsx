import React, { useId } from 'react';
import { useDogStore } from '../../store/useDogStore';
import { cn } from '../../utils/cn';

export interface SidebarCozyPatternProps {
  isDark?: boolean;
  className?: string;
}

export interface SidebarPupAccentProps {
  isDark?: boolean;
  size?: number;
  className?: string;
}

/**
 * Seamless handcrafted autumn & dachshund wallpaper backdrop for the sidebar.
 * Pure inline SVG <pattern> so portable single-file builds bundle everything cleanly.
 */
export const SidebarCozyPattern: React.FC<SidebarCozyPatternProps> = ({
  isDark,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const rawId = useId();
  const safeId = rawId.replace(/:/g, '');
  const patternId = `cozy-sidebar-pattern-${safeId}`;
  const washId = `cozy-sidebar-wash-${safeId}`;

  const palette = dark
    ? {
        washTop: '#1f1915',
        washMid: '#1c1613',
        washBottom: '#181310',
        motifOpacity: 0.2,
        furMain: '#b8855d',
        furDeep: '#8c5e41',
        scarf: '#c06b57',
        balloon: '#c7735c',
        heart: '#be766a',
        paw: '#ad7c55',
        leafWarm: '#ba7b48',
        leafSage: '#72947b',
        acornBody: '#be894e',
        acornCap: '#7d563c',
        ink: '#d9b596',
      }
    : {
        washTop: '#faf1ea',
        washMid: '#f7ebe2',
        washBottom: '#f2e2d6',
        motifOpacity: 0.27,
        furMain: '#c47654',
        furDeep: '#9d5338',
        scarf: '#d86655',
        balloon: '#dc735d',
        heart: '#d97169',
        paw: '#ba7a4e',
        leafWarm: '#c87c42',
        leafSage: '#779779',
        acornBody: '#c78947',
        acornCap: '#8f593c',
        ink: '#7a4530',
      };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden',
        className
      )}
    >
      <svg
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id={washId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.washTop} />
            <stop offset="52%" stopColor={palette.washMid} />
            <stop offset="100%" stopColor={palette.washBottom} />
          </linearGradient>

          <pattern
            id={patternId}
            width="200"
            height="240"
            patternUnits="userSpaceOnUse"
          >
            <g opacity={palette.motifOpacity}>
              {/* 1. Standing cute dachshund with scarf & tiny floating heart (top-left) */}
              <g transform="translate(14, 18)">
                {/* Tail */}
                <path
                  d="M12 31 C5 27, 3 19, 6 16 C8 18, 8 25, 13 29 Z"
                  fill={palette.furDeep}
                />
                {/* Back & front subtle far legs */}
                <path
                  d="M20 40 L20 50 C20 52, 24 52, 24 50 L24 40 Z"
                  fill={palette.furDeep}
                />
                <path
                  d="M48 40 L48 50 C48 52, 52 52, 52 50 L52 40 Z"
                  fill={palette.furDeep}
                />
                {/* Main dachshund torso + neck + snout */}
                <path
                  d="M12 30 C12 25, 22 25, 36 25 C43 25, 47 22, 50 15 C52 9, 58 8, 63 11 C67 13, 72 15, 74 17 C75 19, 73 21, 69 21 C64 21, 61 23, 58 27 C57 31, 56 37, 54 40 L54 51 C54 53, 49 53, 49 51 L49 41 L20 41 L20 51 C20 53, 15 53, 15 51 L15 40 C12 38, 11 34, 12 30 Z"
                  fill={palette.furMain}
                />
                {/* Floppy ear */}
                <path
                  d="M52 12 C47 13, 45 23, 49 27 C52 28, 55 21, 54 13 Z"
                  fill={palette.furDeep}
                />
                {/* Tiny nose & eye */}
                <circle cx="73.5" cy="17" r="1.8" fill={palette.ink} />
                <circle cx="59.5" cy="14" r="1.2" fill={palette.ink} />
                {/* Cozy knit scarf */}
                <path
                  d="M47 23 C51 25, 56 26, 59 24 L58 29 C54 30, 49 29, 46 27 Z"
                  fill={palette.scarf}
                />
                <path
                  d="M48 26 C44 29, 40 31, 38 33 L42 35 C45 33, 48 30, 50 28 Z"
                  fill={palette.scarf}
                />
                {/* Tiny heart above nose */}
                <path
                  d="M77 9 C75 7, 72 8, 72 10.5 C72 13, 77 16, 77 16 C77 16, 82 13, 82 10.5 C82 8, 79 7, 77 9 Z"
                  fill={palette.heart}
                />
              </g>

              {/* 2. Cozy acorn (top-center) */}
              <g transform="translate(115, 22) rotate(16)">
                <path
                  d="M9 3 C10 1, 12 0, 14 1"
                  fill="none"
                  stroke={palette.acornCap}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M2 10 C2 16, 5 21, 9 23 C13 21, 16 16, 16 10 Z"
                  fill={palette.acornBody}
                />
                <path
                  d="M0 10 C0 6, 4 3, 9 3 C14 3, 18 6, 18 10 C12 11.5, 6 11.5, 0 10 Z"
                  fill={palette.acornCap}
                />
              </g>

              {/* 3. Autumn maple leaf (top-right) */}
              <g transform="translate(154, 24) rotate(-18)">
                <path
                  d="M14 2 L16.5 9 L23 7 L20 13.5 L26 17 L19 19.5 L20.5 24 L15 21.5 L15 28 L13 28 L13 21.5 L7.5 24 L9 19.5 L2 17 L8 13.5 L5 7 L11.5 9 Z"
                  fill={palette.leafWarm}
                />
                <path
                  d="M14 8 L14 22 M14 15 L9 11 M14 15 L19 11"
                  stroke={palette.ink}
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </g>

              {/* 4. Cozy paw print (upper-mid right) */}
              <g transform="translate(122, 62) rotate(24)" fill={palette.paw}>
                <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
                <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" transform="rotate(-18 3 6.5)" />
                <ellipse cx="7" cy="4" rx="1.8" ry="2.5" transform="rotate(-5 7 4)" />
                <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" transform="rotate(8 11.5 4.2)" />
                <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" transform="rotate(24 15.2 7)" />
              </g>

              {/* 5. Autumn maple leaf (mid-left) */}
              <g transform="translate(24, 98) rotate(22) scale(0.88)">
                <path
                  d="M14 2 L16.5 9 L23 7 L20 13.5 L26 17 L19 19.5 L20.5 24 L15 21.5 L15 28 L13 28 L13 21.5 L7.5 24 L9 19.5 L2 17 L8 13.5 L5 7 L11.5 9 Z"
                  fill={palette.leafSage}
                />
              </g>

              {/* 6. Playful leaping dachshund reaching for a heart-balloon (middle-right) */}
              <g transform="translate(100, 86)">
                {/* Balloon string */}
                <path
                  d="M69 22 C67 30, 62 34, 57 38"
                  fill="none"
                  stroke={palette.ink}
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* Heart-topped cozy balloon */}
                <path
                  d="M69 22 C60 16, 59 6, 65 4 C68 3, 70 5.5, 70 7 C71 5.5, 73 3.5, 76 4.5 C82 6.5, 79 17, 69 22 Z"
                  fill={palette.balloon}
                />
                <path
                  d="M64 8.5 C64 7, 65.5 6, 67 6.5"
                  fill="none"
                  stroke="#fffcf8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.65"
                />
                {/* Leaping pup silhouette */}
                <g transform="translate(4, 24)">
                  {/* Tail */}
                  <path
                    d="M8 29 C2 26, 0 21, 3 19 C5 21, 5 25, 10 27 Z"
                    fill={palette.furDeep}
                  />
                  {/* Back legs extended */}
                  <path
                    d="M10 32 L3 39 C1 41, 4 43, 6 41 L14 34 Z"
                    fill={palette.furMain}
                  />
                  {/* Torso tilted upward */}
                  <path
                    d="M9 28 C12 23, 24 20, 35 16 C40 14, 42 7, 46 5 C50 4, 54 7, 57 8 C58 10, 56 12, 52 13 C48 14, 46 17, 45 21 L52 24 C54 25, 53 28, 50 28 L42 25 C34 29, 22 33, 12 34 C9 34, 8 31, 9 28 Z"
                    fill={palette.furMain}
                  />
                  {/* Streaming floppy ear */}
                  <path
                    d="M44 8 C37 8, 33 13, 36 17 C39 18, 44 14, 45 9 Z"
                    fill={palette.furDeep}
                  />
                  {/* Nose & joyful eye */}
                  <circle cx="56.5" cy="9" r="1.6" fill={palette.ink} />
                  <circle cx="49" cy="8.5" r="1.1" fill={palette.ink} />
                  {/* Small collar accent */}
                  <path
                    d="M41 16 L46 20"
                    stroke={palette.scarf}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* 7. Second paw print (middle) */}
              <g transform="translate(72, 122) rotate(-20) scale(0.9)" fill={palette.paw}>
                <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
                <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" transform="rotate(-18 3 6.5)" />
                <ellipse cx="7" cy="4" rx="1.8" ry="2.5" transform="rotate(-5 7 4)" />
                <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" transform="rotate(8 11.5 4.2)" />
                <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" transform="rotate(24 15.2 7)" />
              </g>

              {/* 8. Cozy curled sleeping dachshund pup (bottom-left) */}
              <g transform="translate(18, 166)">
                {/* Curled crescent back */}
                <path
                  d="M10 34 C6 20, 19 10, 36 11 C50 12, 58 21, 56 32 C54 41, 42 46, 27 45 C17 45, 11 40, 10 34 Z"
                  fill={palette.furMain}
                />
                {/* Curled tail tucked over left hip */}
                <path
                  d="M12 33 C15 41, 26 44, 33 41 C28 39, 19 37, 15 30 Z"
                  fill={palette.furDeep}
                />
                {/* Head tucked comfortably on paws at right */}
                <path
                  d="M40 20 C45 16, 54 16, 58 21 C61 24, 66 25, 68 28 C69 31, 66 34, 60 34 C53 34, 46 33, 41 29 C38 26, 38 22, 40 20 Z"
                  fill={palette.furMain}
                />
                {/* Tucked cozy paws */}
                <ellipse cx="52" cy="36" rx="7" ry="3.2" fill={palette.furDeep} />
                {/* Draped sleeping ear */}
                <path
                  d="M45 20 C40 22, 39 30, 44 33 C48 33, 50 27, 48 21 Z"
                  fill={palette.furDeep}
                />
                {/* Closed peaceful eye arc & nose */}
                <path
                  d="M53 24 Q55.5 26.5 58 24"
                  fill="none"
                  stroke={palette.ink}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="67.5" cy="28.5" r="1.7" fill={palette.ink} />
                {/* Tiny peaceful heart floating above */}
                <path
                  d="M64 11 C62.5 9.5, 60 10.5, 60 12.5 C60 14.5, 64 17, 64 17 C64 17, 68 14.5, 68 12.5 C68 10.5, 65.5 9.5, 64 11 Z"
                  fill={palette.heart}
                />
              </g>

              {/* 9. Oak leaf & acorn (bottom-right) */}
              <g transform="translate(110, 174) rotate(-25)">
                <path
                  d="M10 2 C12 2, 13 4.5, 12 6 C15 6, 16.5 8.5, 14 11 C17 12, 17 15, 13.5 16.5 C15 19, 13 21.5, 10.5 21 L10.5 26 L9.5 26 L9.5 21 C7 21.5, 5 19, 6.5 16.5 C3 15, 3 12, 6 11 C3.5 8.5, 5 6, 8 6 C7 4.5, 8 2, 10 2 Z"
                  fill={palette.leafWarm}
                />
              </g>

              <g transform="translate(160, 184) rotate(-18)">
                <path
                  d="M9 3 C10 1, 12 0, 14 1"
                  fill="none"
                  stroke={palette.acornCap}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M2 10 C2 16, 5 21, 9 23 C13 21, 16 16, 16 10 Z"
                  fill={palette.acornBody}
                />
                <path
                  d="M0 10 C0 6, 4 3, 9 3 C14 3, 18 6, 18 10 C12 11.5, 6 11.5, 0 10 Z"
                  fill={palette.acornCap}
                />
              </g>

              {/* 10. Bottom-center paw print & scattered mini hearts */}
              <g transform="translate(116, 208) rotate(14) scale(0.85)" fill={palette.paw}>
                <ellipse cx="9" cy="13" rx="4.5" ry="3.8" />
                <ellipse cx="3" cy="6.5" rx="1.8" ry="2.4" transform="rotate(-18 3 6.5)" />
                <ellipse cx="7" cy="4" rx="1.8" ry="2.5" transform="rotate(-5 7 4)" />
                <ellipse cx="11.5" cy="4.2" rx="1.8" ry="2.5" transform="rotate(8 11.5 4.2)" />
                <ellipse cx="15.2" cy="7" rx="1.8" ry="2.4" transform="rotate(24 15.2 7)" />
              </g>

              {/* Scattered little hand-drawn hearts & warm dots */}
              <path
                d="M178 66 C176.2 64, 173 65.2, 173 67.8 C173 70.5, 178 73.8, 178 73.8 C178 73.8, 183 70.5, 183 67.8 C183 65.2, 179.8 64, 178 66 Z"
                fill={palette.heart}
              />
              <path
                d="M15 148 C13.6 146.5, 11 147.4, 11 149.4 C11 151.5, 15 154, 15 154 C15 154, 19 151.5, 19 149.4 C19 147.4, 16.4 146.5, 15 148 Z"
                fill={palette.heart}
              />
              <path
                d="M148 156 C146.5 154.5, 144 155.4, 144 157.4 C144 159.5, 148 162, 148 162 C148 162, 152 159.5, 152 157.4 C152 155.4, 149.5 154.5, 148 156 Z"
                fill={palette.heart}
              />

              {/* Subtle botanical speckles */}
              <circle cx="96" cy="46" r="1.4" fill={palette.leafWarm} opacity="0.7" />
              <circle cx="58" cy="86" r="1.2" fill={palette.heart} opacity="0.65" />
              <circle cx="182" cy="148" r="1.3" fill={palette.leafSage} opacity="0.7" />
              <circle cx="96" cy="196" r="1.2" fill={palette.paw} opacity="0.65" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#${washId})`} />
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

/**
 * Cute peeking dachshund badge accent for the sidebar header.
 */
export const SidebarPupAccent: React.FC<SidebarPupAccentProps> = ({
  isDark,
  size = 38,
  className,
}) => {
  const storeDark = useDogStore((s) => s.theme === 'dark');
  const dark = isDark ?? storeDark;
  const height = Math.round((size * 36) / 44);

  const colors = dark
    ? {
        disc: '#2a211b',
        discBorder: '#45362c',
        fur: '#d89154',
        furCream: '#f1cc9a',
        ear: '#8d5333',
        ink: '#2d1c13',
        nose: '#2d1c13',
        blush: '#df7d73',
        heart: '#e36f63',
        rim: '#3d3028',
      }
    : {
        disc: '#f5e4d6',
        discBorder: '#dec2ac',
        fur: '#d6894b',
        furCream: '#f7d8a8',
        ear: '#965432',
        ink: '#3d261a',
        nose: '#3a2216',
        blush: '#ef8e80',
        heart: '#df6559',
        rim: '#e8d4c3',
      };

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 44 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('flex-shrink-0', className)}
    >
      {/* Cozy soft rounded badge backdrop */}
      <rect
        x="2"
        y="3"
        width="40"
        height="31"
        rx="12"
        fill={colors.disc}
        stroke={colors.discBorder}
        strokeWidth="1.2"
      />

      {/* Tiny floating heart top-right */}
      <path
        d="M36 6.8 C35 5.6, 33 6.2, 33 7.7 C33 9.3, 36 11.4, 36 11.4 C36 11.4, 39 9.3, 39 7.7 C39 6.2, 37 5.6, 36 6.8 Z"
        fill={colors.heart}
      />

      {/* Peeking dachshund floppy ears */}
      <path
        d="M13.5 13.5 C8.5 15, 7 23, 10.5 26 C13 27, 15.5 22, 15 15 Z"
        fill={colors.ear}
        stroke={colors.ink}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M30.5 13.5 C35.5 15, 37 23, 33.5 26 C31 27, 28.5 22, 29 15 Z"
        fill={colors.ear}
        stroke={colors.ink}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Head */}
      <path
        d="M13 18 C13 11.5, 17 8.5, 22 8.5 C27 8.5, 31 11.5, 31 18 C31 23.5, 27.5 27.5, 22 27.5 C16.5 27.5, 13 23.5, 13 18 Z"
        fill={colors.fur}
        stroke={colors.ink}
        strokeWidth="1.3"
      />

      {/* Warm cream muzzle & tan eyebrow pips */}
      <ellipse cx="18.2" cy="14.5" rx="1.6" ry="0.9" fill={colors.furCream} />
      <ellipse cx="25.8" cy="14.5" rx="1.6" ry="0.9" fill={colors.furCream} />
      <ellipse cx="22" cy="22.8" rx="6.2" ry="4.2" fill={colors.furCream} />

      {/* Rosy cheeks */}
      <ellipse cx="16.2" cy="21" rx="1.8" ry="1.1" fill={colors.blush} opacity="0.55" />
      <ellipse cx="27.8" cy="21" rx="1.8" ry="1.1" fill={colors.blush} opacity="0.55" />

      {/* Bright eyes with catchlights */}
      <circle cx="18.2" cy="18" r="1.6" fill={colors.ink} />
      <circle cx="18.7" cy="17.5" r="0.55" fill="#fffcf8" />
      <circle cx="25.8" cy="18" r="1.6" fill={colors.ink} />
      <circle cx="26.3" cy="17.5" r="0.55" fill="#fffcf8" />

      {/* Cute button nose & happy mouth */}
      <ellipse cx="22" cy="21.4" rx="2.1" ry="1.5" fill={colors.nose} />
      <path
        d="M20.2 23.6 Q22 25 23.8 23.6"
        stroke={colors.ink}
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Notebook rim + peeking little paws */}
      <line
        x1="7"
        y1="28.5"
        x2="37"
        y2="28.5"
        stroke={colors.rim}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse
        cx="15.5"
        cy="28"
        rx="2.8"
        ry="2"
        fill={colors.furCream}
        stroke={colors.ink}
        strokeWidth="1.1"
      />
      <ellipse
        cx="28.5"
        cy="28"
        rx="2.8"
        ry="2"
        fill={colors.furCream}
        stroke={colors.ink}
        strokeWidth="1.1"
      />
    </svg>
  );
};
