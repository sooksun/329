/** โลโก้จาก Public Site — วงกลม 3 วง (navy + gold) */
export function HeroLogo({ className = "h-48 w-48 sm:h-64 sm:w-64" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 280" className={className} aria-hidden>
      <g transform="translate(200 120)">
        <circle cx="-80" cy="0" r="110" fill="none" stroke="#142844" strokeWidth="10" />
        <circle cx="0" cy="-55" r="110" fill="none" stroke="#c08a3e" strokeWidth="10" />
        <circle cx="80" cy="0" r="110" fill="none" stroke="#142844" strokeWidth="10" />
      </g>
      <text
        x="200"
        y="248"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="56"
        fontWeight="600"
        fill="#142844"
      >
        31
      </text>
    </svg>
  );
}
