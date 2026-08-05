import { useState, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { Plus, ScrollText, Search, MoreHorizontal, Download, Filter, ChevronDown, UserRound, ChevronRight, ChevronLeft } from "lucide-react";
import CreateApoliceModal from "@/components/modals/create-apolice-modal";
import CreateApoliceProfileModal from "@/components/modals/create-apolice-profile-modal";
import { Button } from "@/components/ui/button";
import seguradoProfile from "@/components/modals/create-profile-modal";

export default function Apolices({ segurados, seguradoras, total, ramos, apolices = [] }: any) {
    const [openModal, setOpenModal] = useState(false);                 // modal de criar
    const [openApoliceProfile, setOpenApoliceProfile] = useState(false);     // modal de perfil da apólice
    const [apoliceSelecionada, setApoliceSelecionada] = useState(null);       // apólice selecionada para o perfil                     // campo de busca
    
    const abrirPerfil = (apolice: any) => {
        setApoliceSelecionada(apolice);
        setOpenApoliceProfile(true);
    };

    const formatarDataBR = (dataString: string) => {
        if (!dataString) return '-';
        const [ano, mes, dia] = dataString.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

    const [busca, setBusca] = useState(
        urlParams.get('busca') || '',
    );

    // Ref para controlar o debounce da busca
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Função de busca acionada ao digitar com debounce (dispara a busca no Back-end via Inertia)
    const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setBusca(valor);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);

            if (valor.trim() !== '') {
                params.set('busca', valor);
            } else {
                params.delete('busca');
            }
            params.delete('page'); // Reseta para a página 1 ao realizar uma nova busca

            router.get(
                window.location.pathname,
                Object.fromEntries(params.entries()),
                {
                    preserveState: true, // Mantém os modais/inputs abertos
                    preserveScroll: true, // Mantém a rolagem da tela
                    replace: true, // Substitui no histórico do navegador
                },
            );
        }, 500); // 500ms de delay
    };

    // Usamos diretamente o array de apólices que vem filtrado do backend
    const apolicesFiltradas = apolices;

    return (
        <>
            <Head title="Apólices" />
            <div className="flex flex-col gap-6 p-6">
                
                {/* 1. Header da Página */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Apólices</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie as apólices e segurados cadastrados
                        </p>
                    </div>
                    <Button onClick={() => setOpenModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                        <Plus className="size-4 mr-1" />
                        Nova Apólice
                    </Button>
                </div>

                {/* 2. Cards de Estatísticas */}
                <div className="flex gap-4 justify-center">
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Total de Apólices</h2>
                            <p className="text-3xl font-bold tracking-tight text-emerald-500">{total}</p>
                        </div>
                        <UserRound className="size-10 text-muted-foreground/50"/>
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Apólices Ativas</h2>
                            <p className="text-3xl font-bold tracking-tight text-emerald-500">2</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-1 items-start justify-between rounded-xl border border-sidebar-border/70 p-6 bg-card shadow-sm">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-sm font-medium text-muted-foreground">Apólices Inativas</h2>
                            <p className="text-3xl font-bold tracking-tight text-red-500">0</p>
                        </div>
                        <ScrollText className="size-10 text-muted-foreground/50" />
                    </div>
                </div>

                {/* 3. Seção da Tabela */}
                <div className="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-sidebar-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">Lista de Apólices</h3>
                            <p className="text-xs text-muted-foreground">
                                {apolicesFiltradas.length} apólice(s) encontrada(s)
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por apólice, cliente, CPF..." 
                                    value={busca}
                                    onChange={handleBuscaChange}
                                    className="h-9 w-64 rounded-md border border-sidebar-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                            
                            <div className="relative">
                                <button className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors min-w-[110px]">
                                    <Filter className="size-4 text-muted-foreground" />
                                    <span>Filtro</span>
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                </button>
                            </div>
                            <button className="inline-flex h-9 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-sm font-medium gap-2 hover:bg-muted transition-colors">
                                <Download className="size-4 text-muted-foreground" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Tabela de Apólices */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground font-medium">
                                    <th className="px-4 py-3 text-left">ID</th>
                                    <th className="px-4 py-3 text-left">Segurado</th>
                                    <th className="px-4 py-3 text-left">Número da Apólice</th>
                                    <th className="px-4 py-3 text-left">Ramo / Seguradora</th>
                                    <th className="px-4 py-3 text-left">Valor do Prêmio</th>
                                    <th className="px-4 py-3 text-left">Parcelas</th>
                                    <th className="px-4 py-3 text-left">Vigência</th>
                                    <th className="px-4 py-3 text-left">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apolicesFiltradas.length > 0 ? (
                                    apolicesFiltradas.map((apolice: any) => (
                                        <tr key={apolice.id} className="border-b border-sidebar-border hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                #{String(apolice.id).padStart(4, '0')}
                                            </td>
                                            <td className="h-12 px-4 font-medium">{apolice.nome_completo}</td>
                                            <td className="h-12 px-4">{apolice.numero_apolice}</td>
                                            <td className="h-12 px-4">{apolice.nome_ramo} / {apolice.nome_fantasia}</td>
                                            <td className="h-12 px-4">R$ {apolice.valor_premio_total}</td>
                                            <td className="h-12 px-4">{apolice.quantidade_parcelas}</td>
                                            <td className="h-12 px-4">{formatarDataBR(apolice.inicio_vigencia)} - {formatarDataBR(apolice.fim_vigencia)}</td>
                                            <td className="h-12 px-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => abrirPerfil(apolice)}
                                                    className="rounded-lg h-8 w-8 p-0"
                                                >
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Nenhuma apólice encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* 4. Paginação */}
                        <div className="flex items-center justify-between px-4 py-4 border-t border-sidebar-border bg-muted/10">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <span className="font-medium text-foreground">1</span> de <span className="font-medium text-foreground">1</span> resultados
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ChevronLeft className="size-3"/>
                                    Anterior
                                </button>
                                <button className="inline-flex h-8 items-center justify-center rounded-md border border-sidebar-border bg-background px-3 text-xs font-medium gap-1 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    Próxima
                                    <ChevronRight className="size-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais da Aplicação */}
            <CreateApoliceModal 
                open={openModal} 
                setOpen={setOpenModal} 
                segurados={segurados} 
                seguradoras={seguradoras} 
                ramos={ramos} 
                apolices={apolices} 
                Profile={seguradoProfile} 
            />
            {apoliceSelecionada && (
                <CreateApoliceProfileModal
                    open={openApoliceProfile}
                    ramos={ramos}
                    setOpen={setOpenApoliceProfile}
                    apolice={apoliceSelecionada}
                />
            )}
        </>
    );
}