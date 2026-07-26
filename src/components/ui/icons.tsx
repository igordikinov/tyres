import type { SVGProps } from 'react';

/**
 * In.Plan icon set (from the In.Plan Design System's 243-icon SVG library),
 * transcribed to React and normalised to `currentColor` so each icon inherits
 * the surrounding text colour. Export names mirror the Heroicons they replace
 * so call sites only swap the import path.
 */
type IconProps = SVGProps<SVGSVGElement>;

/** Play — player-play.svg */
export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M7 4V20L20 12L7 4Z" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Pause — pause-grey.svg */
export function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 13 18" fill="none" {...props}>
      <path d="M0 0.5H4.875V17.5H0V0.5ZM8.125 0.5H13V17.5H8.125V0.5Z" fill="currentColor" />
    </svg>
  );
}

/** Step forward — right-shift.svg */
export function ForwardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.97705 1.1554C1.97705 0.603111 2.42477 0.155396 2.97705 0.155396C3.52934 0.155396 3.97705 0.603111 3.97705 1.1554V18.8446C3.97705 19.3969 3.52934 19.8446 2.97705 19.8446C2.42477 19.8446 1.97705 19.3969 1.97705 18.8446V1.1554ZM11.7675 4.35799C11.3612 4.73209 11.3351 5.36472 11.7092 5.771L14.7428 9.06555H6.32422C5.77193 9.06555 5.32422 9.51327 5.32422 10.0656C5.32422 10.6178 5.77193 11.0656 6.32422 11.0656H14.7274L11.7125 14.3074C11.3364 14.7118 11.3594 15.3445 11.7638 15.7207C12.1682 16.0968 12.801 16.0738 13.1771 15.6694L17.7534 10.7485C17.7712 10.7295 17.7882 10.7099 17.8044 10.6895C17.8385 10.6469 17.8686 10.6022 17.8947 10.5558C17.9764 10.4109 18.0229 10.2437 18.0229 10.0656C18.0229 9.88407 17.9746 9.71388 17.8901 9.56715C17.8679 9.52863 17.843 9.49126 17.8152 9.45533C17.7967 9.43132 17.7771 9.40818 17.7566 9.38597L13.1805 4.41625C12.8064 4.00997 12.1737 3.98389 11.7675 4.35799Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Reset / replay — refresh.svg */
export function ArrowPathIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 21 21" fill="none" {...props}>
      <path
        d="M19.1915 9.02865C19.1915 9.02865 17.5207 6.75216 16.1633 5.39385C14.8059 4.03554 12.9302 3.19531 10.8582 3.19531C6.71602 3.19531 3.35815 6.55318 3.35815 10.6953C3.35815 14.8374 6.71602 18.1953 10.8582 18.1953C14.2774 18.1953 17.1622 15.9072 18.065 12.7786M19.1915 9.02865V4.02865M19.1915 9.02865H14.1915"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** APS / scheduling — chart-gantt.svg */
export function PresentationChartLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9.51864 12.9971H21.6245V17.4468H9.51864V12.9971Z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      <path d="M6.14944 4.82031H18.2553V9.31416H6.14944V4.82031Z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      <path d="M3.02296 2.05371C3.02296 8.46278 3.02296 21.2812 3.02296 21.2812H22.8447" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/** TOC / grid — grid-on.svg */
export function Squares2X2Icon(props: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="none" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.667,3v17 M13.333,3v17 M2,3.944c0-0.25,0.099-0.491,0.277-0.668C2.454,3.099,2.694,3,2.944,3h15.111c0.25,0,0.491,0.099,0.668,0.277C18.9,3.454,19,3.694,19,3.944v15.111c0,0.25-0.099,0.491-0.277,0.668C18.546,19.9,18.306,20,18.056,20H2.944c-0.25,0-0.491-0.1-0.668-0.277S2,19.306,2,19.056V3.944z"
      />
    </svg>
  );
}

/** Undo — corner-up-left.svg */
export function ArrowUturnLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M18 18V12C18 11.2044 17.6839 10.4413 17.1213 9.87868C16.5587 9.31607 15.7956 9 15 9H5M5 9L9 5M5 9L9 13"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Optimise / bolt — flash.svg */
export function BoltIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Close — x-close.svg */
export function XMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M17 7L7 17M7 7L17 17" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Chevron / arrow — arrow-right-thin.svg */
export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
