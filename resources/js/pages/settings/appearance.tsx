import { Head } from '@inertiajs/react';
import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { edit as editAppearance } from '@/routes/appearance';

type Tema = 'light' | 'dark' | 'system';

const OPCOES: {
    valor: Tema;
    titulo: string;
    descricao: string;
    icon: typeof Sun;
    glow: string;
    medalha: string;
    sombra: string;
}[] = [
    {
        valor: 'light',
        titulo: 'Modo Claro',
        descricao: 'Fundo claro e alto contraste, ideal para ambientes bem iluminados.',
        icon: Sun,
        glow: 'from-amber-400/25 via-amber-400/5',
        medalha: 'from-amber-300 to-amber-600',
        sombra: 'shadow-amber-500/40',
    },
    {
        valor: 'dark',
        titulo: 'Modo Escuro',
        descricao: 'Reduz o brilho da tela e cansa menos os olhos à noite.',
        icon: Moon,
        glow: 'from-indigo-400/25 via-indigo-400/5',
        medalha: 'from-indigo-300 to-indigo-700',
        sombra: 'shadow-indigo-500/40',
    },
    {
        valor: 'system',
        titulo: 'Sistema',
        descricao: 'Acompanha automaticamente a preferência configurada no seu aparelho.',
        icon: Laptop,
        glow: 'from-emerald-400/25 via-emerald-400/5',
        medalha: 'from-emerald-300 to-emerald-600',
        sombra: 'shadow-emerald-500/40',
    },
];

export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Aparência" />

            <h1 className="sr-only">Configurações de aparência</h1>

            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                        Configurações
                    </p>
                    <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Aparência
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Escolha como o sistema deve se parecer para você
                    </p>
                </div>

                {/* Cards de seleção de tema */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {OPCOES.map((opcao) => {
                        const Icon = opcao.icon;
                        const selecionado = appearance === opcao.valor;

                        return (
                            <button
                                key={opcao.valor}
                                onClick={() => updateAppearance(opcao.valor)}
                                className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-1.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                                    selecionado
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                        : 'border-border/70 hover:border-emerald-500/40'
                                }`}
                            >
                                {selecionado && (
                                    <span className="absolute top-3.5 right-3.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
                                        <Check className="size-3.5" strokeWidth={3} />
                                    </span>
                                )}

                                {/* Medalhão com glow, estilo cartão de onboarding */}
                                <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[1.35rem] bg-neutral-950 sm:h-48">
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-b to-transparent ${opcao.glow}`}
                                    />
                                    <div
                                        className={`absolute h-36 w-36 rounded-full bg-gradient-to-br opacity-40 blur-3xl ${opcao.medalha}`}
                                    />
                                    <div
                                        className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl transition-transform duration-300 group-hover:scale-105 ${opcao.medalha} ${opcao.sombra}`}
                                    >
                                        <Icon className="size-10 text-white" strokeWidth={1.75} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 px-5 py-4">
                                    <p className="text-base font-bold text-foreground">
                                        {opcao.titulo}
                                    </p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        {opcao.descricao}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                    Sua escolha fica salva neste navegador e é aplicada automaticamente na
                    próxima vez que você entrar.
                </p>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Aparência',
            href: editAppearance(),
        },
    ],
};
