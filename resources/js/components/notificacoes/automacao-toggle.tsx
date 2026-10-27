// Props do interruptor: `ativo` decide a posição/cor; `onChange` é chamado
// no clique — quem usa é que dispara a requisição e troca o estado.
interface ToggleProps {
    ativo: boolean
    onChange: () => void
}

/**
 * Interruptor liga/desliga (verde = ligado, cinza = desligado), pensado para
 * ativar/desativar uma automação de notificação (PATCH /automacoes/{id}/toggle,
 * AutomacoesController::toggle).
 *
 * ATENÇÃO: hoje nenhum arquivo importa este componente — a tela
 * FunctionsApp/notificacoes.tsx declara a própria função Toggle local, com o
 * mesmo visual. Se for mexer no interruptor das automações, é lá que muda.
 */
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