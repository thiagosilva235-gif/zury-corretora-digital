/** Facebook "f" mark, drawn in currentColor; lucide-react has no brand icons. */
export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5C17.5 1.3 16 1 14.5 1 11 1 9 3.1 9 7v2H6v4h3v8z" />
    </svg>
  );
}
