interface ToggleProps {
    ativo: boolean
    onChange: () => void
}

export default function Toggle({ativo, onChange}: ToggleProps) {
    return (
        <button
            onClick={onChange}
            aria-pressed={ativo}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                ativo ? 'bg-emerald-500' : 'bg-muted'
            }`}
        >
            <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    ativo ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
}