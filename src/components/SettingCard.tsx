export default function SettingCard({ children }: { children: React.ReactNode }) {
    return (
        <section
            className="border rounded-xl p-6"
            style={{
                background: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            {children}
        </section>
    )
}