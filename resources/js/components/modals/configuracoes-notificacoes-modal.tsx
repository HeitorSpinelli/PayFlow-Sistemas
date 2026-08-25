import { useState } from 'react';
import { X, Settings, Plus, Pencil, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Automacao } from '@/types/notificacoes';

interface Tipo {
    id: number;
    nome_notificacao: string;
    ativo: boolean;
}

interface ConfiguracoesModalProps {
    aberto: boolean;
    onClose: () => void;
    tipos: Tipo[];
    automacoes: Automacao[];
}

const CONDICOES: Record<string, string> = {
    apolice_vencendo: 'Apólice vencendo',
    parcela_vencendo: 'Parcela vencendo',
    parcela_em_atraso: 'Parcela em atraso',
    cliente_inativo: 'Cliente inativo',
};

export default function ConfigNotificacaoModal({
    aberto,
    onClose,
    tipos,
    automacoes,
}: ConfiguracoesModalProps) {
    const [aba, setAba] = useState<'tipos' | 'automacoes'>('tipos');
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nomeEditando, setNomeEditando] = useState('');

    // Form de tipos
    const { data, setData, post, patch, processing, reset } = useForm({
        nome_notificacao: '',
    });

    // Form de automações
    const {
        data: dataAuto,
        setData: setDataAuto,
        post: postAuto,
        processing: processingAuto,
        reset: resetAuto,
    } = useForm({
        tipo_condicao: '',
        dias: '',
        canal: '',
        tipo_notificacao_id: '',
        mensagem: '',
        ativo: true,
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
            onError: (errors) => {
                const mensagem =
                    errors.nome_notificacao ?? 'Erro ao criar tipo.';
                toast.error(mensagem, { position: 'top-right' });
            },
        });
    };

    const salvarEdicao = (id: number) => {
        router.patch(
            `/tipo_notificacoes/${id}`,
            { nome_notificacao: nomeEditando },
            {
                onSuccess: () => {
                    toast.success('Tipo atualizado!', {
                        position: 'top-right',
                    });
                    setEditandoId(null);
                },
                onError: (errors) => {
                    const mensagem =
                        errors.nome_notificacao ?? 'Erro ao atualizar tipo.';
                    toast.error(mensagem, { position: 'top-right' });
                },
            },
        );
    };

    const toggleAtivo = (id: number, ativo: boolean) => {
        router.patch(
            `/tipo_notificacoes/${id}`,
            { ativo: !ativo },
            {
                onSuccess: () => {
                    toast.success(
                        ativo ? 'Tipo desativado!' : 'Tipo ativado!',
                        { position: 'top-right' },
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

    // --- Funções de Automações ---

    const criarAutomacao = () => {
        postAuto('/automacoes', {
            onSuccess: () => {
                toast.success('Automação criada!', { position: 'top-right' });
                resetAuto();
            },
            onError: () => {
                toast.error('Erro ao criar automação.', {
                    position: 'top-right',
                });
            },
        });
    };

    const toggleAutomacao = (id: number, ativo: boolean) => {
        router.patch(
            `/automacoes/${id}/toggle`,
            { ativo: !ativo },
            {
                onSuccess: () => {
                    toast.success(
                        ativo ? 'Automação desativada!' : 'Automação ativada!',
                        { position: 'top-right' },
                    );
                },
                onError: () => {
                    toast.error('Erro ao atualizar automação.', {
                        position: 'top-right',
                    });
                },
            },
        );
    };

    const deletarAutomacao = (id: number) => {
        router.delete(`/automacoes/${id}`, {
            onSuccess: () => {
                toast.success('Automação excluída!', { position: 'top-right' });
            },
            onError: () => {
                toast.error('Erro ao excluir automação.', {
                    position: 'top-right',
                });
            },
        });
    };

    const podeAdicionarAutomacao =
        dataAuto.tipo_condicao &&
        dataAuto.dias &&
        dataAuto.canal &&
        dataAuto.tipo_notificacao_id &&
        dataAuto.mensagem.trim();

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
                        onClick={() => {
                            setAba('tipos');
                            setEditandoId(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Abas */}
                <div className="flex gap-1 border-b border-border/70 px-5 pt-3">
                    <button
                        onClick={() => setAba('tipos')}
                        className={`rounded-t-lg px-4 py-2 text-sm font-bold transition-colors ${aba === 'tipos' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Tipos de Notificação
                    </button>
                    <button
                        onClick={() => {
                            setAba('automacoes');
                            setEditandoId(null);
                        }}
                        className={`rounded-t-lg px-4 py-2 text-sm font-bold transition-colors ${aba === 'automacoes' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Automações
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
                    {aba === 'tipos' ? (
                        <>
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
                                                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${tipo.ativo ? 'translate-x-4' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Formulário de nova automação */}
                            <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
                                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                    Nova Automação
                                </p>

                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={dataAuto.tipo_condicao}
                                        onChange={(e) =>
                                            setDataAuto(
                                                'tipo_condicao',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    >
                                        <option value="">Condição...</option>
                                        <option value="apolice_vencendo">
                                            Apólice vencendo
                                        </option>
                                        <option value="parcela_vencendo">
                                            Parcela vencendo
                                        </option>
                                        <option value="parcela_em_atraso">
                                            Parcela em atraso
                                        </option>
                                        <option value="cliente_inativo">
                                            Cliente inativo
                                        </option>
                                    </select>

                                    <input
                                        type="number"
                                        min={1}
                                        value={dataAuto.dias}
                                        onChange={(e) =>
                                            setDataAuto('dias', e.target.value)
                                        }
                                        placeholder="Dias..."
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={dataAuto.canal}
                                        onChange={(e) =>
                                            setDataAuto('canal', e.target.value)
                                        }
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    >
                                        <option value="">Canal...</option>
                                        <option value="email">E-mail</option>
                                        <option value="whatsapp">
                                            WhatsApp
                                        </option>
                                    </select>

                                    <select
                                        value={dataAuto.tipo_notificacao_id}
                                        onChange={(e) =>
                                            setDataAuto(
                                                'tipo_notificacao_id',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                    >
                                        <option value="">Tipo...</option>
                                        {tipos.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nome_notificacao}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <textarea
                                    value={dataAuto.mensagem}
                                    onChange={(e) =>
                                        setDataAuto('mensagem', e.target.value)
                                    }
                                    placeholder="Mensagem que será enviada..."
                                    rows={3}
                                    className="resize-none rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                />

                                <Button
                                    onClick={criarAutomacao}
                                    disabled={
                                        processingAuto ||
                                        !podeAdicionarAutomacao
                                    }
                                    className="h-10 w-full rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Adicionar Automação
                                </Button>
                            </div>

                            {/* Lista de automações */}
                            <div className="flex flex-col gap-2">
                                {automacoes.length === 0 && (
                                    <p className="py-6 text-center text-xs text-muted-foreground">
                                        Nenhuma automação cadastrada ainda.
                                    </p>
                                )}
                                {automacoes.map((automacao) => (
                                    <div
                                        key={automacao.id}
                                        className="rounded-xl border border-border/70 px-4 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-foreground">
                                                    {CONDICOES[
                                                        automacao.tipo_condicao
                                                    ] ??
                                                        automacao.tipo_condicao}
                                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                        — {automacao.dias}{' '}
                                                        dia(s)
                                                    </span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {automacao.canal === 'email'
                                                        ? 'E-mail'
                                                        : 'WhatsApp'}
                                                    {automacao.tipo_notificacao &&
                                                        ` · ${automacao.tipo_notificacao.nome_notificacao}`}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {automacao.mensagem}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        toggleAutomacao(
                                                            automacao.id,
                                                            automacao.ativo,
                                                        )
                                                    }
                                                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${automacao.ativo ? 'bg-emerald-500' : 'bg-muted'}`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${automacao.ativo ? 'translate-x-4' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deletarAutomacao(
                                                            automacao.id,
                                                        )
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
