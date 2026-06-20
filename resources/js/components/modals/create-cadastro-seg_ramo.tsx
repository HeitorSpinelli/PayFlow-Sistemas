import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

export default function CreateSeguradoraRamoModal({ open, setOpen }: any) {

    // Lista de ramos que o usuário vai adicionando dinamicamente
    const [ramos, setRamos] = useState<string[]>([]);

    // Valor do input de ramo antes de adicionar na lista
    const [novoRamo, setNovoRamo] = useState('');

    // Formulário da seguradora
    const { data, setData, post, processing } = useForm({
        nome_fantasia: '',
        razao_social:  '',
        cnpj:          '',
        contato_nome:  '',
        email_suporte: '',
        ramos:         [] as string[], // array de ramos que será enviado junto
    });

    // Adiciona o ramo na lista local e atualiza o useForm
    const adicionarRamo = () => {
        //trim para evitar adicionar ramos vazios ou com espaços
        if (!novoRamo.trim()) return;
        // Verifica se o ramo já foi adicionado
        if (ramos.includes(novoRamo.trim())) {
            toast.error('Ramo já adicionado!');
            return;
        }

        // Adiciona o novo ramo na lista de ramos e sincroniza com o formulário
        const ramosAtualizados = [...ramos, novoRamo.trim()];
        setRamos(ramosAtualizados);
        setData('ramos', ramosAtualizados); // sincroniza com o formulário
        setNovoRamo('');
    };

    // Remove um ramo da lista pelo índice
    const removerRamo = (index: number) => {
        const ramosAtualizados = ramos.filter((_, i) => i !== index);
        setRamos(ramosAtualizados);
        setData('ramos', ramosAtualizados);
    };

    // Permite adicionar ramo pressionando Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarRamo();
        }
    };

    const fechar = () => {
        setRamos([]);
        setNovoRamo('');
        setOpen(false);
    };

    const salvar = () => {
        post('/seguradoras', {
            onSuccess: () => {
                toast.success('Seguradora cadastrada com sucesso!');
                fechar();
            },
            onError: () => {
                toast.error('Erro ao cadastrar. Verifique os dados.');
            },
        });
        const limparFormulario = {
            nome_fantasia: '',
            razao_social:  '',
            cnpj:          '',
            contato_nome:  '',
            email_suporte: '',
            ramos:         [] as string[],
        };
        setData(limparFormulario);
    };

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <div className="h-4 w-4 border-2 border-white rounded-sm rotate-45"></div>
                        </div>
                        <span className="text-sm font-black tracking-tighter text-emerald-600 uppercase italic">
                            PayFlow-Sistemas
                        </span>
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        Cadastrar Seguradora
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Preencha os dados da seguradora e adicione seus ramos.
                    </p>
                </DialogHeader>

                {/* Dados da Seguradora */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Dados da Seguradora
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Fantasia*</label>
                            <Input
                                value={data.nome_fantasia}
                                onChange={e => setData('nome_fantasia', e.target.value)}
                                placeholder="Ex: Porto Seguro"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Razão Social</label>
                            <Input
                                value={data.razao_social}
                                onChange={e => setData('razao_social', e.target.value)}
                                placeholder="Ex: Porto Seguro S.A."
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNPJ*</label>
                            <Input
                                value={data.cnpj}
                                onChange={e => setData('cnpj', e.target.value)}
                                placeholder="00.000.000/0000-00"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</label>
                            <Input
                                value={data.contato_nome}
                                onChange={e => setData('contato_nome', e.target.value)}
                                placeholder="Nome do contato"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email de Suporte</label>
                            <Input
                                value={data.email_suporte}
                                onChange={e => setData('email_suporte', e.target.value)}
                                placeholder="suporte@seguradora.com"
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Ramos */}
                <div className="space-y-3 mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Ramos
                    </p>

                    {/* Input para adicionar ramo */}
                    <div className="flex gap-2">
                        <Input
                            value={novoRamo}
                            onChange={e => setNovoRamo(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ex: Automóvel, Vida, Residencial..."
                            className="h-11 rounded-xl"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={adicionarRamo}
                            className="h-11 rounded-xl px-4"
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>

                    {/* Lista de ramos adicionados */}
                    {ramos.length > 0 && (
                        <div className="space-y-2">
                            {ramos.map((ramo, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-muted-foreground/20 bg-muted/30"
                                >
                                    <span className="text-sm font-medium">{ramo}</span>
                                    <button
                                        onClick={() => removerRamo(index)}
                                        className="text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mensagem quando não tem ramos */}
                    {ramos.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Nenhum ramo adicionado. Digite e pressione Enter ou clique em +.
                        </p>
                    )}
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={fechar} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        onClick={salvar}
                        disabled={processing}
                        className="h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                        Cadastrar Seguradora
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}