export const SUPER_ADMIN_EMAIL = 'rikashrikash04@gmail.com'

export const OFFICE_ADMIN_EMAILS = [
    'resulthub001@gmail.com',
    'rikash04rikash@gmail.com',
]

export const OFFICE_TYPE_LABELS: Record<string, string> = {
    hospital: 'Hospital',
    government: 'Government Office',
    post_office: 'Post Office',
    ration_shop: 'Ration Shop',
    aadhaar_center: 'Aadhaar Center',
    other: 'Other',
}

export const OFFICE_TYPE_ICONS: Record<string, string> = {
    hospital: '🏥',
    government: '🏛️',
    post_office: '📮',
    ration_shop: '🏬',
    aadhaar_center: '🪪',
    other: '🏢',
}

export const TOKEN_STATUS_COLORS: Record<string, string> = {
    waiting: 'bg-amber-50 text-amber-700 border-amber-200',
    serving: 'bg-brand-50 text-brand-700 border-brand-200',
    served: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    skipped: 'bg-slate-50 text-slate-500 border-slate-200',
}

export const DEFAULT_AVG_SERVICE_TIME = 5 // minutes
