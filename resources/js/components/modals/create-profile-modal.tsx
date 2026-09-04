import { useForm, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    FileText,
    MapPin,
    Pencil,
    Phone,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

import { aplicarMascaraCEP } from '@/utils/Masks';

// ─────────────────────────────────────────────────────────────
// Define os 3 estados possíveis do modal
// O modal só pode estar em um desses três modos por vez
// ─────────────────────────────────────────────────────────────
type Modo = 'visualizar' | 'editar' | 'excluir';

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

function InfoField({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded-xl border border-border/70 bg-background px-3 py-2.5 shadow-sm">
            <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground">
                {value || 'Não informado'}
            </p>
        </div>
    );
}

interface Estado {
    id: number;
    nome: string;
    sigla: string;
}

// Extraído para função própria (em vez de repetir os mesmos 14 campos em dois
// lugares) porque a divergência entre cópias é exatamente o tipo de bug que
// esse arquivo tinha antes: o formulário nunca era resincronizado com o prop.
function mapSeguradoParaFormulario(segurado: any) {
    return {
        nome_completo: segurado?.nome_completo ?? '',
        cpf_cnpj: segurado?.cpf_cnpj ?? '',
        tipo_pessoa: segurado?.tipo_pessoa ?? '',
        data_nascimento_fundacao: segurado?.data_nascimento_fundacao ?? '',
        email: segurado?.email ?? '',
        telefone_fixo: segurado?.telefone_fixo ?? '',
        celular_whatsapp: segurado?.celular_whatsapp ?? '',
        endereco: segurado?.endereco ?? '',
        bairro: segurado?.bairro ?? '',
        cidade: segurado?.cidade ?? '',
        estado: segurado?.estado ?? '',
        cep: segurado?.cep ?? '',
        status: segurado?.status ?? '',
        observacoes: segurado?.observacoes ?? '',
    };
}

export default function SeguradoProfileModal({ open, setOpen, segurado }: any) {
    // Controla em qual modo o modal está no momento
    // Sempre começa em 'visualizar' quando abre
    const [modo, setModo] = useState<Modo>('visualizar');
    const [estados, setEstados] = useState<Estado[]>([]);

    // useForm do Inertia só lê esses valores iniciais uma vez, no primeiro
    // mount do componente — por isso guardamos o último `segurado` visto e
    // resincronizamos os campos abaixo sempre que ele mudar (ver abrirPerfil
    // em clientes.tsx, que não força um remount deste modal).
    const [ultimoSeguradoSincronizado, setUltimoSeguradoSincronizado] =
        useState(segurado);

    const { data, setData, put, processing, errors } = useForm(
        mapSeguradoParaFormulario(segurado),
    );

    // Ajuste de estado durante a renderização (não dentro de um useEffect):
    // padrão recomendado pelo próprio React para "resetar estado quando uma
    // prop muda" — evita o round-trip extra de um efeito. Sem isso, trocar
    // de cliente (ou reabrir o mesmo após editar) mantinha os dados do
    // cliente exibido anteriormente no formulário de edição — risco real de
    // salvar por cima os dados errados.
    if (segurado !== ultimoSeguradoSincronizado) {
        setUltimoSeguradoSincronizado(segurado);

        if (segurado) {
            setData(mapSeguradoParaFormulario(segurado));
            setModo('visualizar');
        }
    }

    const isPF = segurado?.tipo_pessoa === 'pf';
    const labelDocumento = isPF ? 'CPF' : 'CNPJ';
    const labelData = isPF ? 'Nascimento' : 'Fundação';

    useEffect(() => {
        fetch(
            'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
        )
            .then((resposta) => resposta.json())
            .then(setEstados)
            .catch(() => setEstados([]));
    }, []);

    const buscarCep = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '');

        if (cepLimpo.length === 8) {
            try {
                const response = await fetch(
                    `https://viacep.com.br/ws/${cepLimpo}/json/`,
                );
                const resultado = await response.json();

                if (!resultado.erro) {
                    setData((prev) => ({
                        ...prev,
                        cep: cepLimpo,
                        endereco: resultado.logradouro,
                        bairro: resultado.bairro,
                        cidade: resultado.localidade,
                        estado: resultado.uf,
                    }));
                } else {
                    console.log('CEP não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao buscar o CEP:', error);
            }
        }
    };

    // Fecha o modal e reseta o modo para 'visualizar'
    // Assim na próxima vez que abrir, começa limpo
    const fechar = () => {
        setModo('visualizar');
        setOpen(false);
    };

    // Envia os dados editados para o Laravel via PUT
    // PUT /clientes/{id} — atualiza o segurado no banco
    // Se der certo (onSuccess), fecha o modal
    const salvarEdicao = () => {
        if (!segurado) return;
        put(`/clientes/${segurado.id}`, {
            onSuccess: () => {
                toast.success('Cliente atualizado com sucesso!');
                fechar();
            },
            onError: () => toast.error('Falha ao salvar. Verifique os campos.'),
        });
    };

    const confirmarExclusao = () => {
        if (!segurado) return; // ← proteção
        router.delete(`/clientes/${segurado.id}`, {
            onSuccess: () => toast.success('Cliente excluído com sucesso!'),
            onError: () =>
                toast.error('Erro ao excluir cliente. Tente novamente.'),
            onFinish: () => fechar(), // Fecha o modal mesmo se der erro, para evitar confusão
        });
    };

    const tituloBreadcrumb =
        modo === 'editar'
            ? 'Editar'
            : modo === 'excluir'
              ? 'Excluir'
              : 'Detalhes';

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="!flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl">
                <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/70 bg-gradient-to-br from-emerald-500/[0.12] via-background to-background px-6 py-6 pr-12 sm:px-8">
                    <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                            <span className="text-lg font-bold">
                                {segurado?.nome_completo
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'C'}
                            </span>
                        </div>
                        <div>
                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                <span>Segurados</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{tituloBreadcrumb}</span>
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                                {modo === 'visualizar' &&
                                    segurado?.nome_completo}
                                {modo === 'editar' &&
                                    `Editar cliente: ${segurado?.nome_completo}`}
                                {modo === 'excluir' &&
                                    `Excluir cliente: ${segurado?.nome_completo}`}
                            </DialogTitle>
                        </div>
                    </div>
                    <div className="relative mt-3 flex items-center gap-2">
                        <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                                segurado?.status === 'Ativo'
                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                    : 'border border-rose-500/20 bg-rose-500/10 text-rose-500'
                            }`}
                        >
                            {segurado?.status}
                        </span>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
                    {/* ── MODO VISUALIZAR ── */}
                    {modo === 'visualizar' && (
                        <>
                            <Section
                                icon={<UserRound className="h-4 w-4" />}
                                title="Dados principais"
                                description="Identificação do segurado"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <InfoField
                                        label={labelDocumento}
                                        value={segurado?.cpf_cnpj}
                                    />
                                    <InfoField
                                        label={labelData}
                                        value={
                                            segurado?.data_nascimento_fundacao
                                        }
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<Phone className="h-4 w-4" />}
                                title="Contato"
                                description="Canais para comunicação"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <InfoField
                                            label="Email"
                                            value={segurado?.email}
                                        />
                                    </div>
                                    <InfoField
                                        label="WhatsApp"
                                        value={segurado?.celular_whatsapp}
                                    />
                                    <InfoField
                                        label="Telefone fixo"
                                        value={segurado?.telefone_fixo}
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={<MapPin className="h-4 w-4" />}
                                title="Endereço"
                                description="Localização do segurado"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <InfoField
                                            label="Endereço"
                                            value={segurado?.endereco}
                                        />
                                    </div>
                                    <InfoField
                                        label="Bairro"
                                        value={segurado?.bairro}
                                    />
                                    <InfoField
                                        label="Cidade / Estado"
                                        value={
                                            segurado?.cidade && segurado?.estado
                                                ? `${segurado.cidade} - ${segurado.estado}`
                                                : ''
                                        }
                                    />
                                    <InfoField
                                        label="CEP"
                                        value={segurado?.cep}
                                    />
                                </div>
                            </Section>

                            {segurado?.observacoes && (
                                <Section
                                    icon={<FileText className="h-4 w-4" />}
                                    title="Observações"
                                    description="Anotações sobre o segurado"
                                >
                                    <p className="text-sm leading-relaxed text-foreground">
                                        {segurado.observacoes}
                                    </p>
                                </Section>
                            )}
                        </>
                    )}

                    {/* ── MODO EDITAR ── */}
                    {modo === 'editar' && (
                        <>
                            <Section
                                icon={<UserRound className="h-4 w-4" />}
                                title="Dados principais"
                                description="Identificação do segurado"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Nome completo
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.nome_completo}
                                            onChange={(e) =>
                                                setData(
                                                    'nome_completo',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<Phone className="h-4 w-4" />}
                                title="Contato"
                                description="Canais para comunicação"
                            >
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Email
                                            </label>
                                            <Input
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Celular / WhatsApp
                                            </label>
                                            <Input
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                                type="tel"
                                                value={data.celular_whatsapp}
                                                onChange={(e) =>
                                                    setData(
                                                        'celular_whatsapp',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Telefone fixo
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            type="tel"
                                            value={data.telefone_fixo}
                                            onChange={(e) =>
                                                setData(
                                                    'telefone_fixo',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<MapPin className="h-4 w-4" />}
                                title="Endereço"
                                description="Localização do segurado"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Endereço
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.endereco}
                                            onChange={(e) =>
                                                setData(
                                                    'endereco',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Bairro
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                            value={data.bairro}
                                            onChange={(e) =>
                                                setData(
                                                    'bairro',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.bairro && (
                                            <span className="text-xs font-medium text-rose-500">
                                                {errors.bairro}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Cidade
                                            </label>
                                            <Input
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                                value={data.cidade}
                                                onChange={(e) =>
                                                    setData(
                                                        'cidade',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                CEP *
                                            </label>
                                            <Input
                                                className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                                type="text"
                                                placeholder="00000-000"
                                                value={data.cep}
                                                onChange={(e) => {
                                                    const cepMascarado =
                                                        aplicarMascaraCEP(
                                                            e.target.value,
                                                        );
                                                    setData(
                                                        'cep',
                                                        cepMascarado,
                                                    );
                                                }}
                                                onBlur={(e) =>
                                                    buscarCep(e.target.value)
                                                }
                                            />
                                            {errors.cep && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.cep}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm leading-none font-medium">
                                                Estado *
                                            </label>
                                            <Select
                                                value={data.estado}
                                                onValueChange={(valor) =>
                                                    setData('estado', valor)
                                                }
                                            >
                                                <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none">
                                                    <SelectValue placeholder="Selecione o estado" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-md">
                                                    {estados.map((estado) => (
                                                        <SelectItem
                                                            key={estado.id}
                                                            value={estado.sigla}
                                                            className="cursor-pointer rounded-lg"
                                                        >
                                                            {estado.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.estado && (
                                                <span className="text-xs font-medium text-rose-500">
                                                    {errors.estado}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            <Section
                                icon={<FileText className="h-4 w-4" />}
                                title="Observações"
                                description="Anotações sobre o segurado"
                            >
                                <textarea
                                    className="min-h-24 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm shadow-sm transition-all hover:border-emerald-500/40 focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:outline-none"
                                    value={data.observacoes}
                                    onChange={(e) =>
                                        setData('observacoes', e.target.value)
                                    }
                                />
                            </Section>
                        </>
                    )}

                    {/* ── MODO EXCLUIR ── */}
                    {modo === 'excluir' && (
                        <Section
                            icon={
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            }
                            title="Confirmar exclusão"
                            description="Esta ação não pode ser desfeita"
                        >
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                Tem certeza que deseja excluir o cliente{' '}
                                <span className="font-semibold text-foreground">
                                    {segurado?.nome_completo}
                                </span>
                                ? Todos os dados vinculados a este segurado
                                serão desativados.
                            </p>
                        </Section>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-6 py-4 sm:px-8">
                    {modo === 'visualizar' && (
                        <>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={() => setModo('editar')}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('excluir')}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                        </>
                    )}

                    {modo === 'editar' && (
                        <>
                            <Button
                                className="rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
                                onClick={salvarEdicao}
                                disabled={processing}
                            >
                                Salvar alterações
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('visualizar')}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}

                    {modo === 'excluir' && (
                        <>
                            <Button
                                className="rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                                onClick={confirmarExclusao}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Confirmar exclusão
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() => setModo('visualizar')}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
