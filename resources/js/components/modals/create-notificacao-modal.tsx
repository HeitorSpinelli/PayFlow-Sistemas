import { Check, Mail, MessageCircle, Search, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Canal, Segurado } from '@/types/notificacoes';
import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

interface NotificacaoModalProps {
    canal: Canal | null;
    onClose: () => void;
    segurados: Segurado[];
    tipos: { id: number; nome_notificacao: string; ativo: boolean }[];
}

export default function NotificacaoModal({
    canal,
    onClose,
    segurados,
    tipos,
}: NotificacaoModalProps) {
    const [busca, setBusca] = useState('');
    const [selecionados, setSelecionados] = useState<number[]>([]);
    const [mensagem, setMensagem] = useState('');
    const [tipo, setTipo] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        segurado_ids: [] as number[],
        canal: '',
        mensagem: '',
        tipo_notificacao_id: '',
    });

    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return segurados;

        return segurados.filter(
            (segurado) =>
                segurado.nome_completo.toLowerCase().includes(termo) ||
                segurado.email.toLowerCase().includes(termo) ||
                segurado.cpf_cnpj.toLowerCase().includes(termo),
        );
    }, [busca]);

    const alternarCliente = (id: number) => {
        setSelecionados((prev) =>
            prev.includes(id)
                ? prev.filter((idSelecionado) => idSelecionado !== id)
                : [...prev, id],
        );
    };

    const selecionarTodosVisiveis = () => {
        const idsVisiveis = clientesFiltrados.map((segurado) => segurado.id);
        const todosJaSelecionados = idsVisiveis.every((id) =>
            selecionados.includes(id),
        );
        setSelecionados((prev) =>
            todosJaSelecionados
                ? prev.filter((id) => !idsVisiveis.includes(id))
                : Array.from(new Set([...prev, ...idsVisiveis])),
        );
    };

    const enviarNotificacao = () => {
        setData('segurado_ids', selecionados);
        setData('canal', canal ?? '');
        setData('mensagem', mensagem);
        setData('tipo_notificacao_id', tipo);

        post('/notificacoes', {
            onSuccess: () => {
                toast.success('Notificação Enviada!', {
                    position: 'top-right',
                    style: {
                        color: '#e0ebe4',
                    },
                });
            },
            onError: () => {
                toast.error('Falha ao enviar, Tente mais tarde', {
                    position: 'top-right',
                    style: {
                        color: '#b61212',
                    },
                });
            },
        });
    };

    if (!canal) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
            >
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500 p-2 text-white">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600">
                                Nova Notificação
                            </p>
                            <p className="text-lg font-bold">
                                {canal === 'email'
                                    ? 'Enviar por E-mail'
                                    : 'Enviar por WhatsApp'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar cliente pelo nome ou e-mail"
                            className="h-11 w-full rounded-xl border border-border/70 bg-background pr-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                    </div>

                    <div className="rounded-xl border border-border/70">
                        <button
                            onClick={selecionarTodosVisiveis}
                            className="flex w-full items-center justify-between border-b border-border/70 px-3.5 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/5"
                        >
                            <span>
                                {selecionados.length} cliente(s) selecionado(s)
                            </span>
                            <span>Selecionar todos</span>
                        </button>

                        <div className="flex max-h-56 flex-col overflow-y-auto">
                            {clientesFiltrados.map((cliente) => {
                                const marcado = selecionados.includes(
                                    cliente.id,
                                );
                                return (
                                    <button
                                        key={cliente.id}
                                        onClick={() =>
                                            alternarCliente(cliente.id)
                                        }
                                        className="flex items-center gap-3 border-b border-border/40 px-3.5 py-2.5 text-left last:border-0 hover:bg-muted/40"
                                    >
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                                                marcado
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-border/70'
                                            }`}
                                        >
                                            {marcado && (
                                                <Check
                                                    className="size-3.5"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {cliente.nome_completo}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {canal === 'email'
                                                    ? cliente.email
                                                    : cliente.celular_whatsapp}
                                            </p>
                                        </div>
                                        {cliente.devedor && (
                                            <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                                Devedor
                                            </span>
                                        )}
                                    </button>
                                );
                            })}

                            {clientesFiltrados.length === 0 && (
                                <p className="px-3.5 py-6 text-center text-xs text-muted-foreground">
                                    Nenhum cliente encontrado.
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Tipo de Notificação */}
                    <div className="grid gap-2">
                        <label className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                            Tipo de Notificação
                        </label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            className="h-11 w-full rounded-xl border border-border/70 bg-background px-3.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        >
                            <option value="">Selecione um tipo...</option>
                            {tipos.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nome_notificacao}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
                            Mensagem
                        </label>
                        <textarea
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            rows={4}
                            placeholder={
                                canal === 'email'
                                    ? 'Digite a mensagem que será enviada por e-mail...'
                                    : 'Digite a mensagem que será enviada pelo WhatsApp...'
                            }
                            className="resize-none rounded-xl border border-border/70 bg-background px-3.5 py-3 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-10 rounded-xl px-5 font-bold"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={enviarNotificacao}
                        disabled={
                            selecionados.length === 0 ||
                            mensagem.trim() === '' ||
                            tipo === '' ||
                            processing
                        }
                        className="h-10 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send className="mr-2 size-4" />
                        Enviar ({selecionados.length})
                    </Button>
                </div>
            </div>
        </div>
    );
}
