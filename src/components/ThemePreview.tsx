interface ThemePreviewProps {
    theme: 'classic' | 'retrofuturista';
    isDark: boolean;
}

const palettes = {
    classic: {
        light: { bg: '#ffffff', sidebar: '#ffffff', accent: '#3b82f6', text: '#171717', border: '#e5e7eb' },
        dark: { bg: '#111827', sidebar: '#111827', accent: '#60a5fa', text: '#f3f4f6', border: '#374151' },
    },
    retrofuturista: {
        light: { bg: '#f0f2f8', sidebar: '#f0f2f8', accent: '#0099aa', text: '#1a1a2e', border: 'rgba(0,153,170,0.2)' },
        dark: { bg: '#0a0a12', sidebar: '#12121f', accent: '#00f0ff', text: '#e0e0ff', border: 'rgba(0,240,255,0.25)' },
    },
} as const;

export default function ThemePreview({ theme, isDark }: ThemePreviewProps) {
    const colors = palettes[theme][isDark ? 'dark' : 'light'];

    return (
        <svg
            width="120"
            height="80"
            viewBox="0 0 120 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={`${theme} ${isDark ? 'dark' : 'light'} preview`}
        >
            {/* Background */}
            <rect width="120" height="80" rx="6" fill={colors.bg} />

            {/* Sidebar */}
            <rect x="0" y="0" width="28" height="80" rx="6" fill={colors.sidebar} />
            <rect x="28" y="0" width="1" height="80" fill={colors.border} />

            {/* Sidebar accent indicator */}
            <rect x="0" y="20" width="3" height="10" rx="1" fill={colors.accent} />

            {/* Sidebar nav dots */}
            <circle cx="14" cy="16" r="3" fill={colors.accent} opacity={0.8} />
            <rect x="8" y="24" width="12" height="2" rx="1" fill={colors.text} opacity={0.3} />
            <rect x="8" y="30" width="12" height="2" rx="1" fill={colors.text} opacity={0.2} />
            <rect x="8" y="36" width="12" height="2" rx="1" fill={colors.text} opacity={0.2} />

            {/* Header bar */}
            <rect x="33" y="4" width="82" height="12" rx="3" fill={colors.border} opacity={0.5} />
            <rect x="37" y="8" width="30" height="4" rx="1" fill={colors.text} opacity={0.4} />

            {/* Card 1 */}
            <rect x="33" y="22" width="38" height="24" rx="3" fill={colors.sidebar} stroke={colors.border} strokeWidth="1" />
            <rect x="37" y="26" width="20" height="3" rx="1" fill={colors.text} opacity={0.5} />
            <rect x="37" y="32" width="30" height="2" rx="1" fill={colors.text} opacity={0.2} />
            <rect x="37" y="37" width="16" height="5" rx="2" fill={colors.accent} opacity={0.8} />

            {/* Card 2 */}
            <rect x="77" y="22" width="38" height="24" rx="3" fill={colors.sidebar} stroke={colors.border} strokeWidth="1" />
            <rect x="81" y="26" width="20" height="3" rx="1" fill={colors.text} opacity={0.5} />
            <rect x="81" y="32" width="30" height="2" rx="1" fill={colors.text} opacity={0.2} />
            <rect x="81" y="37" width="16" height="5" rx="2" fill={colors.accent} opacity={0.8} />

            {/* Card 3 */}
            <rect x="33" y="52" width="82" height="22" rx="3" fill={colors.sidebar} stroke={colors.border} strokeWidth="1" />
            <rect x="37" y="56" width="24" height="3" rx="1" fill={colors.text} opacity={0.5} />
            <rect x="37" y="62" width="50" height="2" rx="1" fill={colors.text} opacity={0.2} />
            <rect x="37" y="67" width="16" height="5" rx="2" fill={colors.accent} opacity={0.8} />

            {/* Border around the whole preview */}
            <rect width="120" height="80" rx="6" stroke={colors.border} strokeWidth="1" fill="none" />
        </svg>
    );
}
