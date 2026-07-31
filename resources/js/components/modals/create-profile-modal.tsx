import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { mascaraData } from '@/utils/dateMask';

type Modo = 'visualizar' | 'editar' | 'excluir';

export default function SeguradoProfileModal({ open, setOpen, segurado }: any) {
    const [modo, setModo] = useState<Modo>('visualizar');

    // Converte a data do banco (YYYY-MM-DD) para exibição com máscara (DD/MM/YYYY) no input
    const formataDataParaInput = (dataIso?: string) => {
        if (!dataIso) return '';
        const dataApenas = dataIso.split('T')[0];
        const [ano, mes, dia] = dataApenas.split('-');
        if (ano && mes && dia) {
            return `${dia}/${mes}/${ano}`;
        }
        return '';
    };

    // Converte de volta para o padrão do banco (DD/MM/YYYY -> YYYY-MM-DD) antes de salvar
    const formataDataParaBanco = (dataBr: string) => {
        if (!dataBr || dataBr.length < 10) return dataBr;
        const [dia, mes, ano] = dataBr.split('/');
        if (dia && mes && ano) {
            return `${ano}-${mes}-${dia}`;
        }
        return dataBr;
    };

    // Formatação para exibir na aba "visualizar"
    const formataDataExibicao = (dataStr: string) => {
        if (!dataStr) return 'Não informado';
        const dataPura = dataStr.split('T')[0];
        const [ano, mes, dia] = dataPura.split('-');
        if (ano && mes && dia) {
            return `${dia}/${mes}/${ano}`;
        }
        return dataStr;
    };

    const { data, setData, processing } = useForm({
        nome_completo: segurado?.nome_completo ?? '',
        cpf_cnpj: segurado?.cpf_cnpj ?? '',
        tipo_pessoa: segurado?.tipo_pessoa ?? '',
        data_nascimento_fundacao: formataDataParaInput(segurado?.data_nascimento_fundacao),
        email: segurado?.email ?? '',
        telefone_fixo: segurado?.telefone_fixo ?? '',
        celular_whatsapp: segurado?.celular_whatsapp ?? '',
        endereco: segurado?.endereco ?? '',
        cidade: segurado?.cidade ?? '',
        estado: segurado?.estado ?? '',
        cep: segurado?.cep ?? '',
        status: segurado?.status ?? '',
        observacoes: segurado?.observacoes ?? '',
    });

    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    const salvarEdicao = () => {
        if (!segurado) return;

        const dadosParaEnviar = {
            ...data,
            data_nascimento_fundacao: formataDataParaBanco(data.data_nascimento_fundacao),
        };

        router.put(`/clientes/${segurado.id}`, dadosParaEnviar, {
            onSuccess: () => {
                toast.success('Cliente atualizado com sucesso!');
                fechar();
            },
            onError: () => {
                toast.error('Erro ao atualizar cliente. Verifique os campos.');
            },
        });
    };

    const confirmarExclusao = () => {
        if (!segurado) return;
        router.delete(`/clientes/${segurado.id}`, {
            onSuccess: () => toast.success('Cliente excluído com sucesso!'),
            onError: () =>
                toast.error('Erro ao excluir cliente. Tente novamente.'),
            onFinish: () => fechar(),
        });
    };

    if (!segurado) return null;

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                            <span className="text-lg font-bold text-emerald-500">
                                {segurado.nome_completo?.charAt(0).toUpperCase() ?? ''}
                            </span>
                        </div>

                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {modo === 'visualizar' && segurado.nome_completo}
                                {modo === 'editar' && `Editar Cliente: ${segurado.nome_completo}`}
                                {modo === 'excluir' && `Excluir Cliente: ${segurado.nome_completo}`}
                            </DialogTitle>

                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    segurado.status === 'Ativo'
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'bg-red-500/10 text-red-500'
                                }`}
                            >
                                {segurado.status}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {modo === 'visualizar' && (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Identificação
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    {segurado.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.cpf_cnpj || 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    {segurado.tipo_pessoa === 'pf' ? 'Nascimento' : 'Fundação'}
                                </p>
                                <p className="text-sm font-medium">
                                    {formataDataExibicao(segurado.data_nascimento_fundacao)}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Contato
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    Email
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.email || 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    WhatsApp
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.celular_whatsapp || 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    Telefone Fixo
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.telefone_fixo || 'Não informado'}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Endereço
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    Endereço
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.endereco || 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    Cidade / Estado
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.cidade && segurado.estado
                                        ? `${segurado.cidade} - ${segurado.estado}`
                                        : 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                                    CEP
                                </p>
                                <p className="text-sm font-medium">
                                    {segurado.cep || 'Não informado'}
                                </p>
                            </div>
                        </div>

                        {segurado.observacoes && (
                            <>
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Observações
                                </p>
                                <div className="rounded-xl border border-muted-foreground/20 p-3">
                                    <p className="text-sm">{segurado.observacoes}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {modo === 'editar' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Nome Completo
                                </label>
                                <Input
                                    value={data.nome_completo}
                                    onChange={(e) => setData('nome_completo', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Email
                                </label>
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Data Nascimento/Fundação
                                </label>
                                <Input
                                    value={data.data_nascimento_fundacao}
                                    onChange={(e) =>
                                        setData('data_nascimento_fundacao', mascaraData(e.target.value))
                                    }
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    WhatsApp
                                </label>
                                <Input
                                    value={data.celular_whatsapp}
                                    onChange={(e) => setData('celular_whatsapp', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Telefone Fixo
                                </label>
                                <Input
                                    value={data.telefone_fixo}
                                    onChange={(e) => setData('telefone_fixo', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    CEP
                                </label>
                                <Input
                                    value={data.cep}
                                    onChange={(e) => setData('cep', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Endereço
                                </label>
                                <Input
                                    value={data.endereco}
                                    onChange={(e) => setData('endereco', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Cidade
                                </label>
                                <Input
                                    value={data.cidade}
                                    onChange={(e) => setData('cidade', e.target.value)}
                                    className="h-11 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Estado
                                </label>
                                <Input
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    className="h-11 rounded-xl"
                                    maxLength={2}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Observações
                                </label>
                                <textarea
                                    value={data.observacoes}
                                    onChange={(e) => setData('observacoes', e.target.value)}
                                    className="min-h-[80px] w-full resize-none rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {modo === 'excluir' && (
                    <div className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <p className="text-sm font-semibold text-red-500">
                            Atenção — esta ação não pode ser desfeita.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            O cliente{' '}
                            <span className="font-semibold text-foreground">
                                {segurado.nome_completo}
                            </span>{' '}
                            e todos os seus dados serão removidos permanentemente do sistema.
                        </p>
                    </div>
                )}

                <div className="mt-6 flex justify-between">
                    {modo === 'visualizar' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setModo('editar')}
                                className="rounded-xl"
                            >
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setModo('excluir')}
                                className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                            >
                                Excluir
                            </Button>
                        </div>
                    )}

                    <div className="ml-auto flex gap-2">
                        {modo === 'visualizar' && (
                            <Button variant="outline" onClick={fechar} className="rounded-xl">
                                Fechar
                            </Button>
                        )}

                        {modo === 'editar' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setModo('visualizar')}
                                    className="rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={salvarEdicao}
                                    disabled={processing}
                                    className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                                >
                                    Salvar alterações
                                </Button>
                            </>
                        )}

                        {modo === 'excluir' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setModo('visualizar')}
                                    className="rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmarExclusao}
                                    className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                                >
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