import { MessageCircle, Send, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Uma bolha do chat: do usuário (verde, à direita) ou do Dininho (cinza, à esquerda).
interface Mensagem {
    autor: 'usuario' | 'dininho';
    texto: string;
}

// Chave do sessionStorage onde a conversa fica salva; quantas mensagens
// anteriores vão junto como contexto (o back-end aceita até 20); e o limite de
// caracteres da pergunta (mesmo max:1000 validado em DininhoController).
const CHAVE_STORAGE = 'dininho:mensagens';
const MAX_HISTORICO_ENVIADO = 12;
const MAX_CARACTERES = 1000;

// Lê a conversa salva desta aba ao montar o widget; qualquer erro = conversa vazia.
function carregarMensagensSalvas(): Mensagem[] {
    try {
        const bruto = sessionStorage.getItem(CHAVE_STORAGE);
        const dados = bruto ? JSON.parse(bruto) : [];

        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

/**
 * Dininho — assistente de chat (IA) do PayFlow. Renderizado pelo layout
 * autenticado (layouts/app/app-sidebar-layout.tsx), então aparece em TODAS as
 * telas internas como um botão flutuante 🦖 no canto inferior direito.
 *
 * Partes da tela:
 *   - Botão flutuante: abre/fecha a janela; mostra um ponto vermelho quando
 *     chegou resposta com o chat fechado.
 *   - Janela de chat: cabeçalho (com lixeira para limpar a conversa), lista de
 *     mensagens com indicador "digitando" e campo de pergunta + botão enviar.
 * Cada pergunta faz POST /dininho/perguntar (DininhoController::pergunta ->
 * DininhoService), limitado a 4 por minuto pela rota (throttle:4,1); o 429
 * vira uma mensagem amigável no chat. Usa fetch puro (não Inertia) porque a
 * resposta é JSON, não uma página.
 */
export default function DininhoWidget() {
    // Janela do chat visível ou escondida.
    const [aberto, setAberto] = useState(false);
    // Conversa exibida na janela (inicia com o que estava salvo na aba).
    const [mensagens, setMensagens] = useState<Mensagem[]>(
        carregarMensagensSalvas,
    );
    // Texto digitado no campo de pergunta.
    const [pergunta, setPergunta] = useState('');
    // true enquanto espera a resposta: mostra os três pontinhos e trava o campo/botão.
    const [carregando, setCarregando] = useState(false);
    // Ponto vermelho no botão flutuante: resposta chegou com o chat fechado.
    const [temMensagemNaoLida, setTemMensagemNaoLida] = useState(false);

    // Âncora no fim da lista (para rolar até a última mensagem) e referência do campo (para dar foco).
    const fimDaListaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Persiste a conversa por aba: sobrevive a um F5, mas não vaza entre
    // sessões diferentes do navegador nem entre usuários da mesma máquina.
    useEffect(() => {
        try {
            sessionStorage.setItem(CHAVE_STORAGE, JSON.stringify(mensagens));
        } catch {
            // sessionStorage pode falhar (modo privado, cota cheia etc.) —
            // a conversa continua funcionando, só não é salva.
        }
    }, [mensagens]);

    // Rola a lista até o fim sempre que entra mensagem nova ou o "digitando" aparece.
    useEffect(() => {
        fimDaListaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
        });
    }, [mensagens, carregando]);

    // Ao abrir o chat, coloca o cursor no campo de pergunta.
    useEffect(() => {
        if (aberto) {
            inputRef.current?.focus();
        }
    }, [aberto]);

    // Clique no botão flutuante: abre/fecha a janela; ao abrir, apaga o aviso de não lida.
    const alternarChat = () => {
        setAberto((valor) => {
            const novoValor = !valor;

            if (novoValor) {
                setTemMensagemNaoLida(false);
            }

            return novoValor;
        });
    };

    // Lixeira do cabeçalho: apaga a conversa da tela e do sessionStorage.
    const limparConversa = () => {
        setMensagens([]);
        try {
            sessionStorage.removeItem(CHAVE_STORAGE);
        } catch {
            // idem — não é crítico se falhar
        }
    };

    // Enter no campo ou botão enviar: adiciona a pergunta na tela, manda ao
    // back-end com as últimas mensagens como histórico e adiciona a resposta
    // (ou uma mensagem de erro amigável) como bolha do Dininho.
    const enviarPergunta = async () => {
        const perguntaAtual = pergunta.trim();

        if (!perguntaAtual || carregando) {
            return;
        }

        const historico = mensagens.slice(-MAX_HISTORICO_ENVIADO);

        setMensagens((prev) => [
            ...prev,
            { autor: 'usuario', texto: perguntaAtual },
        ]);
        setPergunta('');
        setCarregando(true);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';

            const response = await fetch('/dininho/perguntar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ pergunta: perguntaAtual, historico }),
            });

            let respostaTexto: string;

            if (response.status === 429) {
                respostaTexto =
                    'Estou recebendo muitas perguntas agora. Aguarde um instante e tente novamente.';
            } else if (!response.ok) {
                respostaTexto =
                    'Desculpe, não consegui responder agora. Tente novamente em instantes.';
            } else {
                const data = await response.json();
                respostaTexto =
                    data.resposta ??
                    'Desculpe, não consegui processar sua pergunta.';
            }

            setMensagens((prev) => [
                ...prev,
                { autor: 'dininho', texto: respostaTexto },
            ]);

            if (!aberto) {
                setTemMensagemNaoLida(true);
            }
        } catch {
            setMensagens((prev) => [
                ...prev,
                {
                    autor: 'dininho',
                    texto: 'Desculpe, não consegui responder agora. Verifique sua conexão.',
                },
            ]);

            if (!aberto) {
                setTemMensagemNaoLida(true);
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={alternarChat}
                aria-label={aberto ? 'Fechar Dininho' : 'Abrir Dininho'}
                // Mobile/tablet: botão menor e mais no canto, para cobrir
                // menos conteúdo; em lg+ volta ao tamanho/posição original.
                className="group fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-600 active:scale-95 lg:right-6 lg:bottom-6 lg:h-14 lg:w-14 lg:text-2xl"
            >
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-emerald-500/30 blur-xl transition-opacity group-hover:opacity-80" />

                {aberto ? (
                    <X className="size-6 text-white" />
                ) : (
                    <span
                        className="drop-shadow-sm"
                        role="img"
                        aria-hidden="true"
                    >
                        🦖
                    </span>
                )}

                {!aberto && temMensagemNaoLida && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 ring-2 ring-background">
                        <span className="size-2 rounded-full bg-white" />
                    </span>
                )}
            </button>

            {/* Janela de chat */}
            <div
                // Mobile: janela ocupa a largura (com margem) e nunca passa
                // da altura da tela; em lg+ volta ao card 320×520 original.
                className={`fixed right-3 bottom-20 left-3 z-50 flex h-[min(520px,calc(100dvh-6.5rem))] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-black/20 transition-all duration-200 sm:left-auto sm:w-80 lg:right-6 lg:bottom-24 lg:h-[520px] ${
                    aberto
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none translate-y-3 scale-95 opacity-0'
                }`}
            >
                {/* Header */}
                <div className="relative overflow-hidden border-b border-border/70 bg-emerald-500/10 px-4 py-3">
                    <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-lg">
                            🦖
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-foreground">
                                Dininho
                            </h3>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Assistente do PayFlow
                            </p>
                        </div>
                        {mensagens.length > 0 && (
                            <button
                                onClick={limparConversa}
                                aria-label="Limpar conversa"
                                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mensagens */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {mensagens.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                            <span className="text-4xl">🦖</span>
                            <p className="text-sm font-medium text-foreground">
                                Oi, eu sou o Dininho!
                            </p>
                            <p className="max-w-[220px] text-xs text-muted-foreground">
                                Pode perguntar qualquer coisa sobre o PayFlow —
                                clientes, apólices, pagamentos, financeiro...
                            </p>
                        </div>
                    )}

                    {mensagens.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    msg.autor === 'usuario'
                                        ? 'rounded-br-sm bg-emerald-500 text-white'
                                        : 'rounded-bl-sm bg-muted text-foreground'
                                }`}
                            >
                                {msg.texto}
                            </div>
                        </div>
                    ))}

                    {carregando && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                            </div>
                        </div>
                    )}

                    <div ref={fimDaListaRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border/70 p-3">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={pergunta}
                            onChange={(e) =>
                                setPergunta(
                                    e.target.value.slice(0, MAX_CARACTERES),
                                )
                            }
                            onKeyDown={(e) =>
                                e.key === 'Enter' && enviarPergunta()
                            }
                            placeholder="Digite sua pergunta..."
                            disabled={carregando}
                            className="flex-1 rounded-xl border border-border/70 bg-background px-3.5 py-2.5 text-sm transition-colors outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
                        />
                        <button
                            onClick={enviarPergunta}
                            disabled={carregando || !pergunta.trim()}
                            aria-label="Enviar pergunta"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        >
                            <Send className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
