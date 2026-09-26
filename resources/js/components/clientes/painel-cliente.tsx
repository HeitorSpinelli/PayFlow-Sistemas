import { useForm } from '@inertiajs/react';
import {
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
import { InfoField, Section } from '@/components/ui/detail-section';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { aplicarMascaraCEP, formatarTelefone } from '@/utils/Masks';

type Modo = 'visualizar' | 'editar';

interface Estado {
    id: number;
    nome: string;
    sigla: string;
}

function mapSeguradoParaFormulario(segurado: any) {
    return {
        nome_completo: segurado?.nome_completo ?? '',
        razao_social: segurado?.razao_social ?? '',
        email: segurado?.email ?? '',
        telefone_fixo: segurado?.telefone_fixo ?? '',
        celular_whatsapp: segurado?.celular_whatsapp ?? '',
        endereco: segurado?.endereco ?? '',
        bairro: segurado?.bairro ?? '',
        cidade: segurado?.cidade ?? '',
        estado: segurado?.estado ?? '',
        cep: segurado?.cep ?? '',
        observacoes: segurado?.observacoes ?? '',
    };
}

interface PainelClienteProps {
    segurado: any;
    onExcluir: (segurado: any) => void;
}

export default function PainelCliente({
    segurado,
    onExcluir,
}: PainelClienteProps) {
    // Quem usa este componente passa key={segurado.id} (ver clientes.tsx) —
    // isso força uma remontagem completa a cada cliente diferente, então o
    // useForm abaixo sempre nasce com os dados certos. Sem isso, trocar de
    // cliente só mudaria os props e o formulário manteria os dados do
    // cliente anterior — o modal antigo resolvia isso ajustando estado
    // durante a renderização; aqui a remontagem via key evita até precisar
    // desse ajuste.
    const [modo, setModo] = useState<Modo>('visualizar');
    const [estados, setEstados] = useState<Estado[]>([]);

    const { data, setData, put, processing, errors } = useForm(
        mapSeguradoParaFormulario(segurado),
    );

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
                }
            } catch (error) {
                console.error('Erro ao buscar o CEP:', error);
            }
        }
    };

    const salvarEdicao = () => {
        if (!segurado) {
            return;
        }

        put(`/clientes/${segurado.id}`, {
            onSuccess: () => setModo('visualizar'),
            onError: () => toast.error('Falha ao salvar. Verifique os campos.'),
        });
    };

    if (!segurado) {
        return (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center lg:sticky lg:top-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <UserRound className="size-6" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Nenhum cliente selecionado
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Clique em um cliente na lista para ver os dados
                        completos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex max-h-[calc(100vh-14rem)] flex-col gap-5 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm lg:sticky lg:top-6">
            <div className="shrink-0 border-b border-border/70 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <span className="text-lg font-semibold">
                            {segurado?.nome_completo
                                ?.charAt(0)
                                ?.toUpperCase() || 'C'}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">
                            {segurado.nome_completo}
                        </p>
                        <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                                segurado?.status === 'Ativo'
                                    ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                    : 'border border-border/70 bg-muted text-muted-foreground'
                            }`}
                        >
                            {segurado?.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="scroll-fina min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-2 sm:px-6">
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
                                    value={segurado?.data_nascimento_fundacao}
                                />
                                {!isPF && (
                                    <div className="sm:col-span-2">
                                        <InfoField
                                            label="Razão social"
                                            value={segurado?.razao_social}
                                        />
                                    </div>
                                )}
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
                                <InfoField label="CEP" value={segurado?.cep} />
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
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                        value={data.nome_completo}
                                        onChange={(e) =>
                                            setData(
                                                'nome_completo',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                {!isPF && (
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Razão social
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                            value={data.razao_social}
                                            onChange={(e) =>
                                                setData(
                                                    'razao_social',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                )}
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
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm leading-none font-medium">
                                            Celular / WhatsApp
                                        </label>
                                        <Input
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                            type="tel"
                                            value={data.celular_whatsapp}
                                            onChange={(e) =>
                                                setData(
                                                    'celular_whatsapp',
                                                    formatarTelefone(
                                                        e.target.value,
                                                    ),
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
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                        type="tel"
                                        value={data.telefone_fixo}
                                        onChange={(e) =>
                                            setData(
                                                'telefone_fixo',
                                                formatarTelefone(
                                                    e.target.value,
                                                ),
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
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                        value={data.endereco}
                                        onChange={(e) =>
                                            setData('endereco', e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm leading-none font-medium">
                                        Bairro
                                    </label>
                                    <Input
                                        className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                        value={data.bairro}
                                        onChange={(e) =>
                                            setData('bairro', e.target.value)
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
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
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
                                            className="h-10 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground/55 hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                            type="text"
                                            placeholder="00000-000"
                                            value={data.cep}
                                            onChange={(e) => {
                                                const cepMascarado =
                                                    aplicarMascaraCEP(
                                                        e.target.value,
                                                    );
                                                setData('cep', cepMascarado);
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
                                            <SelectTrigger className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none">
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
                                className="min-h-24 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm transition-colors hover:border-emerald-500/40 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                                value={data.observacoes}
                                onChange={(e) =>
                                    setData('observacoes', e.target.value)
                                }
                            />
                        </Section>
                    </>
                )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/70 bg-background px-5 py-4 sm:px-6">
                {modo === 'visualizar' && (
                    <>
                        <Button
                            className="rounded-xl bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
                            onClick={() => setModo('editar')}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                            onClick={() => onExcluir(segurado)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </Button>
                    </>
                )}

                {modo === 'editar' && (
                    <>
                        <Button
                            className="rounded-xl bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
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
            </div>
        </div>
    );
}
