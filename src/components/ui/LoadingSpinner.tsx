import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm text-slate-500">{text}</p>
        </div>
    )
}
