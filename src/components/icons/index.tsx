import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M7 17h10v4H7z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function SortIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4v16M4 8l3-4 3 4" />
      <path d="M17 20V4M14 16l3 4 3-4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

export function DiceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SwordsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4L10 14" />
      <path d="M4 14v6h6" />
      <path d="M4 20l10-10" />
      <path d="M7 17l-3 3" />
      <path d="M17 7l3-3" />
    </svg>
  );
}

export function SkullIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 11a7 7 0 1114 0v4a2 2 0 01-1 1.7V19a1 1 0 01-1 1h-1.5v-2h-3v2h-3v-2H8v2H6.5a1 1 0 01-1-1v-2.3A2 2 0 014.5 15" />
      <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <path d="M11 16l1-1.5 1 1.5" />
    </svg>
  );
}

export function ScrollIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8a2 2 0 00-2-2z" />
      <path d="M9 9h6M9 13h6" />
    </svg>
  );
}

export function TombstoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 21V10a6 6 0 0112 0v11" />
      <path d="M4 21h16" />
      <path d="M9 11h6M12 11v5" />
    </svg>
  );
}

export function Heraldry(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l6 2v6c0 4-3 7-6 8-3-1-6-4-6-8V5l6-2z" />
      <path d="M12 8v7" />
      <path d="M9 11h6" />
    </svg>
  );
}

export function QuillIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4c-5 0-10 3-13 8-1 2-2 4-2 6 2 0 4-1 6-2 5-3 8-8 9-12z" />
      <path d="M5 20l5-5" />
    </svg>
  );
}
