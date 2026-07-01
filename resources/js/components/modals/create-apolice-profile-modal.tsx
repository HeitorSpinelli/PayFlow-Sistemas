import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

type Modo = 'visualizar' | 'editar' | 'excluir';

export default function CreateApoliceProfileModal({ open, setOpen, apolice, ramos }: any) {

    const [modo, setModo] = useState<Modo>('visualizar');

    const { data, setData, put, processing, setData: resetForm } = useForm({
        numero_apolice: '',
        cliente_id: '',
        seguradora_id: '',
        ramo_id: '',
        valor_premio_total: '',
        valor_cobertura: '',
        quantidade_parcelas: '',
        forma_pagamento: '',
        inicio_vigencia: '',
        fim_vigencia: '',
        status: '',
        observacoes: '',
    });

    // Atualiza o formulário sempre que uma nova apólice for selecionada ou o modal abrir
    useEffect(() => {
        if (apolice) {
            resetForm({
                numero_apolice: apolice.numero_apolice ?? '',
                cliente_id: apolice.cliente_id ?? '',
                seguradora_id: apolice.seguradora_id ?? '',
                ramo_id: apolice.ramo_id ?? '',
                valor_premio_total: apolice.valor_premio_total ?? '',
                valor_cobertura: apolice.valor_cobertura ?? '',
                quantidade_parcelas: apolice.quantidade_parcelas ?? '',
                forma_pagamento: apolice.forma_pagamento ?? '',
                inicio_vigencia: apolice.inicio_vigencia ?? '',
                fim_vigencia: apolice.fim_vigencia ?? '',
                status: apolice.status ?? '',
                observacoes: apolice.observacoes ?? '',
            });
        }
    }, [apolice, open]);

    const formatarDataBR = (dataString: string) => {
        if (!dataString) return '-';
        // Divide a string no 'T' para pegar apenas a parte da data (AAAA-MM-DD)
        const [ano, mes, dia] = dataString.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    const salvarEdicao = () => {
        if (!apolice) return;
        put(`/apolices/${apolice.id}`, {
            onSuccess: () => {
                toast.success('Apólice atualizada com sucesso!');
                fechar();
            },
            onError: () => toast.error('Verifique os dados enviados.'),
        });
    };

    const confirmarExclusao = () => {
        if (!apolice) return;
        router.delete(`/apolices/${apolice.id}`, {
            onSuccess: () => toast.success('Apólice excluída com sucesso!'),
            onError: () => toast.error('Erro ao excluir apólice.'),
            onFinish: () => fechar(),
        });
    };

    if (!apolice) return null;

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-500 font-bold text-lg">
                                {apolice.nome_completo?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {modo === 'visualizar' && `Apólice #${apolice.numero_apolice}`}
                                {modo === 'editar' && `Editar Apólice: #${apolice.numero_apolice}`}
                                {modo === 'excluir' && `Excluir Apólice: #${apolice.numero_apolice}`}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">Segurado: {apolice.nome_completo}</p>
                            {apolice.status_vigencia === 'Vigente' && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                Vigente
                            </span>
                        )}
                        {apolice.status_vigencia === 'Para Renovar' && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 animate-pulse">
                                Para Renovar
                            </span>
                        )}
                        </div>
                    </div>
                </DialogHeader>
                {/* ── MODO VISUALIZAR ── */}
                {modo === 'visualizar' && (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informações Gerais</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ramo / Seguradora</p>
                                <p className="text-sm font-medium">{apolice.nome_ramo} / {apolice.nome_fantasia}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Número da Apólice</p>
                                <p className="text-sm font-medium">{apolice.numero_apolice}</p>
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valores e Parcelas</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prêmio Total</p>
                                <p className="text-sm font-medium text-emerald-600 font-mono">R$ {apolice.valor_premio_total}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cobertura</p>
                                <p className="text-sm font-medium font-mono">R$ {apolice.valor_cobertura || 'N/I'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parcelas / Forma</p>
                                <p className="text-sm font-medium">{apolice.quantidade_parcelas}x ({apolice.forma_pagamento || 'N/I'})</p>
                            </div>
                        </div>

                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vigência</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Início</p>
                                <p className="text-sm font-medium">{formatarDataBR(apolice.inicio_vigencia)}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fim</p>
                                <p className="text-sm font-medium">{formatarDataBR(apolice.fim_vigencia)}</p>
                            </div>
                        </div>

                        {apolice.observacoes && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</p>
                                <div className="rounded-xl border border-muted-foreground/20 p-3">
                                    <p className="text-sm whitespace-pre-line">{apolice.observacoes}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── MODO EDITAR ── */}
                {modo === 'editar' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número da Apólice</label>
                                <Input value={data.numero_apolice} onChange={e => setData('numero_apolice', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                                <Input value={data.status} onChange={e => setData('status', e.target.value)} className="h-11 rounded-xl" placeholder="Ativo / Inativo" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ramo</label>
                                <select 
                                    value={data.ramo_id} 
                                    onChange={e => setData('ramo_id', e.target.value)} 
                                    className="w-full h-11 rounded-xl border border-muted-foreground/20 bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                >
                                    <option value="">Selecione um ramo</option>
                                    {ramos?.map((ramo: any) => (
                                        <option key={ramo.id} value={ramo.id}>
                                            {ramo.nome_ramo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor do Prêmio Total</label>
                                <Input value={data.valor_premio_total} onChange={e => setData('valor_premio_total', e.target.value)} className="h-11 rounded-xl" type="number" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor de Cobertura</label>
                                <Input value={data.valor_cobertura} onChange={e => setData('valor_cobertura', e.target.value)} className="h-11 rounded-xl" type="number" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade Parcelas</label>
                                <Input value={data.quantidade_parcelas} onChange={e => setData('quantidade_parcelas', e.target.value)} className="h-11 rounded-xl" type="number" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</label>
                                <Input value={data.forma_pagamento} onChange={e => setData('forma_pagamento', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Início Vigência</label>
                                <Input value={data.inicio_vigencia} onChange={e => setData('inicio_vigencia', e.target.value)} className="h-11 rounded-xl" type="date" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fim Vigência</label>
                                <Input value={data.fim_vigencia} onChange={e => setData('fim_vigencia', e.target.value)} className="h-11 rounded-xl" type="date" />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
                                <textarea
                                    value={data.observacoes}
                                    onChange={e => setData('observacoes', e.target.value)}
                                    className="w-full min-h-[80px] rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
                                />
                            </div>
                    </div>
                )}

                {/* ── MODO EXCLUIR ── */}
                {modo === 'excluir' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                        <p className="text-sm font-semibold text-red-500">Atenção — esta ação não pode ser desfeita.</p>
                        <p className="text-sm text-muted-foreground">
                            A apólice de número <span className="font-semibold text-foreground">{apolice.numero_apolice}</span> vinculada a <span className="font-semibold text-foreground">{apolice.nome_completo}</span> será permanentemente removida.
                        </p>
                    </div>
                )}

                {/* Footer Botões */}
                <div className="flex justify-between mt-6">
                    {modo === 'visualizar' && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setModo('editar')} className="rounded-xl">Editar</Button>
                            <Button variant="outline" onClick={() => setModo('excluir')} className="rounded-xl text-red-500 hover:text-red-500 border-red-500/30 hover:bg-red-500/10">Excluir</Button>
                        </div>
                    )}

                    <div className="flex gap-2 ml-auto">
                        {modo === 'visualizar' && (
                            <Button variant="outline" onClick={fechar} className="rounded-xl">Fechar</Button>
                        )}

                        {modo === 'editar' && (
                            <>
                                <Button variant="outline" onClick={() => setModo('visualizar')} className="rounded-xl">Cancelar</Button>
                                <Button onClick={salvarEdicao} disabled={processing} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
                                    Salvar alterações
                                </Button>
                            </>
                        )}

                        {modo === 'excluir' && (
                            <>
                                <Button variant="outline" onClick={() => setModo('visualizar')} className="rounded-xl">Cancelar</Button>
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