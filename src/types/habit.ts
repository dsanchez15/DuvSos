export interface Completion {
    id: string
    date: string
}

export interface Habit {
    id: string
    title: string
    description?: string | null
    color: string
    completions: Completion[]
    createdAt: string
}

export interface HabitFormData {
    title: string
    description: string
    color: string
}
