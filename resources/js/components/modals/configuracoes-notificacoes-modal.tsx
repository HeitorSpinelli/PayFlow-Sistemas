import { useState } from 'react';
import { X, Settings, Plus, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';

interface ConfiguracoesModalProps {
    aberto: boolean;
    onClose: () => void;
    tipos: { id: number; nome_notificacao: string; ativo: boolean }[];
}

export default function ConfigNotificacaoModal({
    aberto,
    onClose,
    tipos,
}: ConfiguracoesModalProps) {
    const [aba, setAba] = useState<'tipos' | 'automacoes'>('tipos');
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nomeEditando, setNomeEditando] = useState('');

    const { data, setData, post, patch, processing, reset } = useForm({
        nome_notificacao: '',
    });

    if (!aberto) return null;

    const criarTipo = () => {
        post('/tipo_notificacoes', {
            onSuccess: () => {
                toast.success('Tipo criado com sucesso!', {
                    position: 'top-right',
                });
                reset();
            },
            onError: () => {
                toast.error('Erro ao criar tipo.', { position: 'top-right' });
            },
        });
    };

    const salvarEdicao = (id: number) => {
        patch(`/tipo_notificacoes/${id}`, {
            onSuccess: () => {
                toast.success('Tipo atualizado!', { position: 'top-right' });
                setEditandoId(null);
            },
            onError: () => {
                toast.error('Erro ao atualizar tipo.', {
                    position: 'top-right',
                });
            },
        });
    };

    const toggleAtivo = (id: number, ativo: boolean) => {
        router.patch(
            `/tipo_notificacoes/${id}`,
            { ativo: !ativo },
            {
                onSuccess: () => {
                    toast.success(
                        ativo ? 'Tipo desativado!' : 'Tipo ativado!',
                        {
                            position: 'top-right',
                        },
                    );
                },
                onError: () => {
                    toast.error('Erro ao atualizar tipo.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
            >
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500 p-2 text-white">
                            <Settings size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600">
                                NOTIFICAÇÕES
                            </p>
                            <p className="text-lg font-bold">Configurações</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Abas */}
                <div className="flex gap-1 border-b border-border/70 px-5 pt-3">
                    <button
                        onClick={() => setAba('tipos')}
                        className={`rounded-t-lg px-4 py-2 text-sm font-bold transition-colors ${
                            aba === 'tipos'
                                ? 'border-b-2 border-emerald-500 text-emerald-600'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Tipos de Notificação
                    </button>
                    <button
                        onClick={() => setAba('automacoes')}
                        className={`rounded-t-lg px-4 py-2 text-sm font-bold transition-colors ${
                            aba === 'automacoes'
                                ? 'border-b-2 border-emerald-500 text-emerald-600'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Automações
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
                    {aba === 'tipos' ? (
                        <>
                            {/* Campo pra criar novo tipo */}
                            <div className="flex gap-2">
                                <input
                                    value={data.nome_notificacao}
                                    onChange={(e) =>
                                        setData(
                                            'nome_notificacao',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nome do novo tipo..."
                                    className="h-10 flex-1 rounded-xl border border-border/70 bg-background px-3.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                />
                                <Button
                                    onClick={criarTipo}
                                    disabled={
                                        processing ||
                                        !data.nome_notificacao.trim()
                                    }
                                    className="h-10 rounded-xl bg-emerald-500 px-4 font-bold text-white hover:bg-emerald-600"
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {/* Lista de tipos */}
                            <div className="flex flex-col gap-2">
                                {tipos.length === 0 && (
                                    <p className="py-6 text-center text-xs text-muted-foreground">
                                        Nenhum tipo cadastrado ainda.
                                    </p>
                                )}
                                {tipos.map((tipo) => (
                                    <div
                                        key={tipo.id}
                                        className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3"
                                    >
                                        {editandoId === tipo.id ? (
                                            <input
                                                value={nomeEditando}
                                                onChange={(e) =>
                                                    setNomeEditando(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-8 flex-1 rounded-lg border border-border/70 bg-background px-2 text-sm focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span
                                                className={`text-sm font-semibold ${!tipo.ativo ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                            >
                                                {tipo.nome_notificacao}
                                            </span>
                                        )}
                                        <div className="ml-3 flex items-center gap-2">
                                            {editandoId === tipo.id ? (
                                                <button
                                                    onClick={() =>
                                                        salvarEdicao(tipo.id)
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditandoId(tipo.id);
                                                        setNomeEditando(
                                                            tipo.nome_notificacao,
                                                        );
                                                    }}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    toggleAtivo(
                                                        tipo.id,
                                                        tipo.ativo,
                                                    )
                                                }
                                                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${tipo.ativo ? 'bg-emerald-500' : 'bg-muted'}`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${tipo.ativo ? 'translate-x-4 bg-emerald-500' : 'translate-x-0 bg-muted'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Automações em breve.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
