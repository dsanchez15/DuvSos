export interface Completion {
    id: number
    date: string
}

export interface Habit {
    id: number
    title: string
    description?: string | null
    color: string
    completions: Completion[]
    createdAt: string
}

export interface HabitFormData {
    title: string
    description?: string | null
    color: string
}
