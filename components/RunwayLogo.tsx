/** Runway logo — stylized "R" mark. Use consistently per branding. */
export function RunwayLogo({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        clipRule="evenodd"
        d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z"
        fillRule="evenodd"
      />
    </svg>
  );
}
