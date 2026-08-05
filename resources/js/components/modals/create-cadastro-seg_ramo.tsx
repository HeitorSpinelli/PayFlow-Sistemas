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
import { X, Plus, Building2, ChevronRight, FileText, Phone, Mail, Hash } from 'lucide-react';

function Section({ icon, title, description, children }: any) {
    return (
        <section className="rounded-2xl border border-border/70 bg-muted/[0.18] p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

export default function CreateSeguradoraRamoModal({ open, setOpen }: any) {
    const [ramos, setRamos] = useState<string[]>([]);
    const [novoRamo, setNovoRamo] = useState('');

    const { data, setData, post, processing } = useForm({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        contato_nome: '',
        email_suporte: '',
        ramos: [] as string[],
    });

    const adicionarRamo = () => {
        if (!novoRamo.trim()) return;
        if (ramos.includes(novoRamo.trim())) {
            toast.error('Ramo já adicionado!');
            return;
        }

        const ramosAtualizados = [...ramos, novoRamo.trim()];
        setRamos(ramosAtualizados);
        setData('ramos', ramosAtualizados);
        setNovoRamo('');
    };

    const removerRamo = (index: number) => {
        const ramosAtualizados = ramos.filter((_, i) => i !== index);
        setRamos(ramosAtualizados);
        setData('ramos', ramosAtualizados);
    };

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
            razao_social: '',
            cnpj: '',
            contato_nome: '',
            email_suporte: '',
            ramos: [] as string[],
        };
        setData(limparFormulario);
    };

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="!flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                
                {/* Header */}
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Seguradoras</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>Novo cadastro</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                Cadastrar seguradora
                            </DialogTitle>
                        </div>
                    </div>
                    <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        Preencha os dados da seguradora e adicione seus ramos. Campos obrigatórios estão marcados com{' '}
                        <span className="font-bold text-emerald-600">*</span>.
                    </p>
                </DialogHeader>

                {/* Body com Scroll */}
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    
                    {/* Seção: Dados da Seguradora */}
                    <Section
                        icon={<Building2 className="h-4 w-4" />}
                        title="Dados da seguradora"
                        description="Informações principais e identificação"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Nome Fantasia *
                                </label>
                                <Input
                                    value={data.nome_fantasia}
                                    onChange={e => setData('nome_fantasia', e.target.value)}
                                    placeholder="Ex: Porto Seguro"
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Razão Social
                                </label>
                                <Input
                                    value={data.razao_social}
                                    onChange={e => setData('razao_social', e.target.value)}
                                    placeholder="Ex: Porto Seguro S.A."
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        CNPJ *
                                    </label>
                                    <Input
                                        value={data.cnpj}
                                        onChange={e => setData('cnpj', e.target.value)}
                                        placeholder="00.000.000/0000-00"
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Contato
                                    </label>
                                    <Input
                                        value={data.contato_nome}
                                        onChange={e => setData('contato_nome', e.target.value)}
                                        placeholder="Nome do contato"
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm leading-none font-medium">
                                    Email de Suporte
                                </label>
                                <Input
                                    value={data.email_suporte}
                                    onChange={e => setData('email_suporte', e.target.value)}
                                    placeholder="suporte@seguradora.com"
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Seção: Ramos */}
                    <Section
                        icon={<FileText className="h-4 w-4" />}
                        title="Ramos de atuação"
                        description="Adicione os ramos suportados pela seguradora"
                    >
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={novoRamo}
                                    onChange={e => setNovoRamo(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ex: Automóvel, Vida, Residencial..."
                                    className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={adicionarRamo}
                                    className="h-10 rounded-xl border-border/70 px-4 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {ramos.length > 0 && (
                                <div className="space-y-2">
                                    {ramos.map((ramo, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-border/70 bg-background shadow-sm"
                                        >
                                            <span className="text-sm font-medium">{ramo}</span>
                                            <button
                                                type="button"
                                                onClick={() => removerRamo(index)}
                                                className="text-muted-foreground hover:text-rose-500 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {ramos.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Nenhum ramo adicionado. Digite e pressione Enter ou clique em +.
                                </p>
                            )}
                        </div>
                    </Section>
                </div>

                {/* Footer / Botões */}
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:px-8">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={fechar} 
                        className="h-10 rounded-xl border-border/70 hover:bg-muted/50"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={salvar}
                        disabled={processing}
                        className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 px-5"
                    >
                        Cadastrar Seguradora
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}