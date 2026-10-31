import { useForm } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Dados mínimos da apólice vencida que a tela Administração (aba "Apólices
// Inativas/Vencidas/Canceladas", lista "Apólices Vencidas") passa ao modal.
// Servem para pré-preencher o formulário da nova apólice.
interface ApoliceVencida {
    id: number;
    numero_apolice: string;
    valor_premio_total: string | number;
    valor_cobertura: string | number;
    quantidade_parcelas: number;
    fim_vigencia: string;
}

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    apolice: ApoliceVencida | null;
}

// Sugere o novo ciclo de vigência a partir do dia seguinte ao fim da
// vigência vencida, com duração padrão de 1 ano — o usuário pode ajustar
// livremente antes de confirmar.
function sugerirNovaVigencia(fimVigenciaAntiga: string) {
    const inicio = new Date(fimVigenciaAntiga);
    inicio.setDate(inicio.getDate() + 1);

    const fim = new Date(inicio);
    fim.setFullYear(fim.getFullYear() + 1);

    return {
        inicio: inicio.toISOString().split('T')[0],
        fim: fim.toISOString().split('T')[0],
    };
}

/**
 * Modal "Renovar apólice #...".
 *
 * Aberto pela tela Administração (pages/FunctionsApp/administracao.tsx), aba
 * "Apólices Inativas/Vencidas/Canceladas", botão "Renovar" de cada linha da
 * lista "Apólices Vencidas" (só admin: a rota exige `can:is-admin`).
 *
 * Props:
 * - open / setOpen: controlam a visibilidade (estado da página Administração).
 * - apolice: apólice vencida escolhida. Sem ela o modal não renderiza nada.
 *
 * Tela: um formulário único com número da nova apólice, início/fim da
 * vigência, valor do prêmio, valor de cobertura e quantidade de parcelas,
 * mais os botões "Cancelar" e "Confirmar Renovação".
 *
 * Ao confirmar, faz PATCH /apolices/renovar/{id} (ApolicesController::renovar
 * → ApoliceService::renovar). O back-end cria uma apólice NOVA, com número
 * próprio, e arquiva a antiga como histórico. As regras de validação estão no
 * próprio controller: número único, fim depois do início, prêmio > 0,
 * 1 a 60 parcelas.
 */
export default function RenovarApoliceModal({ open, setOpen, apolice }: Props) {
    // Estado do formulário (Inertia useForm). `errors` recebe as mensagens de
    // validação do back-end, que aparecem em vermelho embaixo de cada campo.
    const { data, setData, patch, processing, errors, reset } = useForm({
        numero_apolice: '',
        inicio_vigencia: '',
        fim_vigencia: '',
        valor_premio_total: '',
        valor_cobertura: '',
        quantidade_parcelas: 1,
    });

    // Toda vez que o modal abre com uma apólice, pré-preenche o formulário:
    // vigência sugerida (dia seguinte ao fim da antiga + 1 ano) e os mesmos
    // prêmio, cobertura e parcelas da antiga. O número fica vazio de propósito,
    // porque a nova apólice precisa de um número próprio.
    useEffect(() => {
        if (apolice && open) {
            const { inicio, fim } = sugerirNovaVigencia(apolice.fim_vigencia);
            setData({
                numero_apolice: '',
                inicio_vigencia: inicio,
                fim_vigencia: fim,
                valor_premio_total: String(apolice.valor_premio_total ?? ''),
                valor_cobertura: String(apolice.valor_cobertura ?? ''),
                quantidade_parcelas: apolice.quantidade_parcelas ?? 1,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apolice, open]);

    // Fecha o modal e limpa o formulário. Usado pelo botão "Cancelar", pelo X
    // e pelo clique fora do diálogo, e também depois de renovar com sucesso.
    const fechar = () => {
        setOpen(false);
        reset();
    };

    // Botão "Confirmar Renovação": envia PATCH /apolices/renovar/{id}. Se der
    // certo, fecha o modal e o Inertia recarrega a página Administração (a
    // apólice sai da lista de vencidas). Se a validação falhar, mostra um toast
    // vermelho e deixa as mensagens de erro embaixo dos campos.
    // O toast de sucesso não é mostrado aqui — o layout já mostra
    // automaticamente a partir da flash message do backend (que já inclui o
    // número da nova apólice); duplicar com toast.success aqui mostrava dois
    // avisos a cada renovação.
    const confirmarRenovacao = () => {
        if (!apolice) {
            return;
        }

        patch(`/apolices/renovar/${apolice.id}`, {
            onSuccess: () => fechar(),
            onError: () => toast.error('Verifique os dados informados.'),
        });
    };

    if (!apolice) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => (v ? setOpen(true) : fechar())}
        >
            <DialogContent className="sm:max-w-lg max-sm:max-h-[94dvh] max-lg:[&_input]:text-base max-lg:[&_textarea]:text-base">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                            <RefreshCw className="h-4 w-4" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                Renovar apólice #{apolice.numero_apolice}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">
                                Gera uma apólice nova, com número próprio, para
                                o novo ciclo de vigência — a antiga fica
                                arquivada como histórico
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Formulário da nova apólice (campos validados em ApolicesController::renovar) */}
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Número da Nova Apólice*
                        </label>
                        <Input
                            value={data.numero_apolice}
                            onChange={(e) =>
                                setData('numero_apolice', e.target.value)
                            }
                            placeholder="Ex: AP-2027-0001"
                            className="h-10 rounded-xl border-border/80 bg-background"
                        />
                        {errors.numero_apolice && (
                            <span className="text-xs font-medium text-rose-500">
                                {errors.numero_apolice}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Início da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.inicio_vigencia}
                                onChange={(e) =>
                                    setData('inicio_vigencia', e.target.value)
                                }
                                className="h-10 rounded-xl border-border/80 bg-background"
                            />
                            {errors.inicio_vigencia && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.inicio_vigencia}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Fim da Vigência*
                            </label>
                            <Input
                                type="date"
                                value={data.fim_vigencia}
                                onChange={(e) =>
                                    setData('fim_vigencia', e.target.value)
                                }
                                className="h-10 rounded-xl border-border/80 bg-background"
                            />
                            {errors.fim_vigencia && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.fim_vigencia}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Valor do Prêmio*
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_premio_total}
                                onChange={(e) =>
                                    setData(
                                        'valor_premio_total',
                                        e.target.value,
                                    )
                                }
                                className="h-10 rounded-xl border-border/80 bg-background"
                            />
                            {errors.valor_premio_total && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.valor_premio_total}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Valor de Cobertura
                            </label>
                            <Input
                                type="number"
                                placeholder="R$ 0,00"
                                value={data.valor_cobertura}
                                onChange={(e) =>
                                    setData('valor_cobertura', e.target.value)
                                }
                                className="h-10 rounded-xl border-border/80 bg-background"
                            />
                            {errors.valor_cobertura && (
                                <span className="text-xs font-medium text-rose-500">
                                    {errors.valor_cobertura}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 sm:w-1/2 sm:pr-2">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Quantidade de Parcelas*
                        </label>
                        <Input
                            type="number"
                            min="1"
                            max="60"
                            value={data.quantidade_parcelas}
                            onChange={(e) =>
                                setData(
                                    'quantidade_parcelas',
                                    Number(e.target.value),
                                )
                            }
                            className="h-10 rounded-xl border-border/80 bg-background"
                        />
                        {errors.quantidade_parcelas && (
                            <span className="text-xs font-medium text-rose-500">
                                {errors.quantidade_parcelas}
                            </span>
                        )}
                    </div>
                </div>

                {/* Rodapé: Cancelar / Confirmar Renovação */}
                <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                    <Button variant="outline" onClick={fechar}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmarRenovacao}
                        disabled={processing}
                        className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                    >
                        Confirmar Renovação
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
