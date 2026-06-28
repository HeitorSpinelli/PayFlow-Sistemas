import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Por enquanto só temos 2 modos: visualizar e excluir.
// 'editar' fica de fora até decidirmos com o cliente como vai
// funcionar o preenchimento de parcela/data — ver create-pagamentos-modal.tsx
// ─────────────────────────────────────────────────────────────
type Modo = 'visualizar' | 'excluir';

export default function PagamentoProfileModal({ open, setOpen, pagamento }: any) {

    // Controla em qual modo o modal está no momento
    // Sempre começa em 'visualizar' quando abre
    const [modo, setModo] = useState<Modo>('visualizar');

    // Fecha o modal e reseta o modo para 'visualizar'
    // Assim na próxima vez que abrir, começa limpo
    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    // Envia DELETE /pagamentos/{id} — remove o pagamento do banco
    const confirmarExclusao = () => {
        if (!pagamento) return; // ← proteção
        router.delete(`/pagamentos/${pagamento.id}`, {
            onSuccess: () => toast.success('Pagamento excluído com sucesso!'),
            onError: () => toast.error('Erro ao excluir pagamento. Tente novamente.'),
            onFinish: () => fechar(), // Fecha o modal mesmo se der erro, para evitar confusão
        });
    };

    if (!pagamento) return null;

    // Define a cor do badge de status, igual ao padrão da tabela
    const statusCor = pagamento.status === 'confirmado'
        ? 'bg-green-500/10 text-green-500'
        : 'bg-orange-500/10 text-orange-500';

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

                {/* ── HEADER ──
                    Sempre visível independente do modo
                    O título muda conforme o modo atual */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-3">

                        {/* Avatar com a primeira letra do nome do cliente */}
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-500 font-bold text-lg">
                                {pagamento.cliente?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                        </div>

                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {modo === 'visualizar' && pagamento.cliente}
                                {modo === 'excluir'    && 'Excluir Pagamento'}
                            </DialogTitle>

                            {/* Badge de status — verde se confirmado, laranja se pendente */}
                            {modo === 'visualizar' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusCor}`}>
                                    {pagamento.status}
                                </span>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* ── MODO VISUALIZAR ──
                    Exibe os dados do pagamento em cards organizados por seção */}
                {modo === 'visualizar' && (
                    <div className="space-y-4">

                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apólice</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número</p>
                                <p className="text-sm font-medium">{pagamento.apolice || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parcela</p>
                                <p className="text-sm font-medium">{pagamento.parcela ? `${pagamento.parcela}ª` : 'Não informado'}</p>
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pagamento</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor</p>
                                <p className="text-sm font-medium">R$ {pagamento.valor}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Data do Pagamento</p>
                                <p className="text-sm font-medium">{pagamento.data_pagamento || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3 col-span-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Forma de Pagamento</p>
                                <p className="text-sm font-medium capitalize">{pagamento.forma_pagamento || 'Não informado'}</p>
                            </div>
                        </div>

                        {pagamento.observacoes && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</p>
                                <div className="rounded-xl border border-muted-foreground/20 p-3">
                                    <p className="text-sm">{pagamento.observacoes}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── MODO EXCLUIR ──
                    Exibe um aviso vermelho pedindo confirmação antes de deletar */}
                {modo === 'excluir' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                        <p className="text-sm font-semibold text-red-500">Atenção — esta ação não pode ser desfeita.</p>
                        <p className="text-sm text-muted-foreground">
                            O pagamento de <span className="font-semibold text-foreground">{pagamento.cliente}</span> referente
                            à apólice <span className="font-semibold text-foreground">{pagamento.apolice}</span> ({pagamento.parcela}ª parcela)
                            será removido permanentemente do sistema.
                        </p>
                    </div>
                )}

                {/* ── BOTÕES ──
                    Os botões também mudam conforme o modo */}
                <div className="flex justify-between mt-6">

                    {/* Botão Excluir — só aparece no modo visualizar */}
                    {/* TODO: adicionar botão "Editar" aqui quando definirmos com o cliente
                        como vai funcionar o fluxo de parcela/data */}
                    {modo === 'visualizar' && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModo('excluir')} className="rounded-xl text-red-500 hover:text-red-500 border-red-500/30 hover:bg-red-500/10">
                                Excluir
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 ml-auto">

                        {modo === 'visualizar' && (
                            <Button variant="outline" onClick={fechar} className="rounded-xl">
                                Fechar
                            </Button>
                        )}

                        {modo === 'excluir' && (
                            <>
                                <Button variant="outline" onClick={() => setModo('visualizar')} className="rounded-xl">
                                    Cancelar
                                </Button>
                                <Button onClick={confirmarExclusao} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                                    Confirmar exclusão
                                </Button>
                            </>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
