// Types for Q-Pro
export type UserRole = 'super_admin' | 'office_admin' | 'public'

export type OfficeType =
    | 'hospital'
    | 'government'
    | 'post_office'
    | 'ration_shop'
    | 'aadhaar_center'
    | 'other'

export type TokenStatus = 'waiting' | 'serving' | 'served' | 'skipped'

export interface Office {
    id: string
    name: string
    slug: string
    type: OfficeType
    description: string | null
    address: string | null
    phone: string | null
    is_active: boolean
    created_at: string
}

export interface Department {
    id: string
    office_id: string
    name: string
    avg_service_time_mins: number
    is_active: boolean
    created_at: string
}

export interface UserRoleRecord {
    id: string
    user_id: string
    role: UserRole
    office_id: string | null
    created_at: string
    offices?: Office
}

export interface QueueToken {
    id: string
    office_id: string
    department_id: string | null
    token_number: number
    user_name: string
    user_phone: string | null
    user_id?: string | null
    status: TokenStatus
    joined_at: string
    served_at: string | null
    estimated_wait_mins: number
    departments?: Department
    offices?: Office
}

export interface OfficeQueueState {
    id: string
    office_id: string
    current_token: number
    is_paused: boolean
    is_closed: boolean
    updated_at: string
}

export interface OfficeStats {
    totalToday: number
    served: number
    waiting: number
    skipped: number
    avgServiceTime: number
}
