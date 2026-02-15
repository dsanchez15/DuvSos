export default function SettingCard({ children }: { children: React.ReactNode }) {
    return (
        <section className="bg-white dark:bg-background-dark/50 border border-primary/10 rounded-xl p-6 shadow-sm">
            {children}
        </section>
    )
}