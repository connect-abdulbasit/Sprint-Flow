// ConfirmDeleteModal.tsx
import { AlertCircle, X } from "lucide-react"

interface ConfirmDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, description }: ConfirmDeleteModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background p-6 rounded-xl max-w-md w-full space-y-4">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
