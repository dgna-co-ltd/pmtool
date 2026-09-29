/** Small stroke icons for the compact (icon-only) task-list toolbar, matching notification-bell.tsx's hand-drawn style. */

function Svg({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <Svg>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 19h16" />
    </Svg>
  );
}

export function UploadIcon() {
  return (
    <Svg>
      <path d="M12 15V3m0 0l-4 4m4-4l4 4" />
      <path d="M4 19h16" />
    </Svg>
  );
}

export function SparkleIcon() {
  return (
    <Svg>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 15l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7z" />
    </Svg>
  );
}

export function PlusIcon() {
  return (
    <Svg>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function NoteIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M4 4h12l4 4v12H4z" />
      <path d="M16 4v4h4" />
      <path d="M8 12h8M8 16h5" />
    </Svg>
  );
}
