import { MessageCircle, Send, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Mensagem {
    autor: 'usuario' | 'dininho';
    texto: string;
}

const CHAVE_STORAGE = 'dininho:mensagens';
const MAX_HISTORICO_ENVIADO = 12;
const MAX_CARACTERES = 1000;

function carregarMensagensSalvas(): Mensagem[] {
    try {
        const bruto = sessionStorage.getItem(CHAVE_STORAGE);
        const dados = bruto ? JSON.parse(bruto) : [];

        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

export default function DininhoWidget() {
    const [aberto, setAberto] = useState(false);
    const [mensagens, setMensagens] = useState<Mensagem[]>(carregarMensagensSalvas);
    const [pergunta, setPergunta] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [temMensagemNaoLida, setTemMensagemNaoLida] = useState(false);

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

    useEffect(() => {
        fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [mensagens, carregando]);

    useEffect(() => {
        if (aberto) {
            inputRef.current?.focus();
        }
    }, [aberto]);

    const alternarChat = () => {
        setAberto((valor) => {
            const novoValor = !valor;

            if (novoValor) {
                setTemMensagemNaoLida(false);
            }

            return novoValor;
        });
    };

    const enviarPergunta = async () => {
        const perguntaAtual = pergunta.trim();

        if (!perguntaAtual || carregando) {
            return;
        }

        const historico = mensagens.slice(-MAX_HISTORICO_ENVIADO);

        setMensagens((prev) => [...prev, { autor: 'usuario', texto: perguntaAtual }]);
        setPergunta('');
        setCarregando(true);

        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

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
                respostaTexto = 'Estou recebendo muitas perguntas agora. Aguarde um instante e tente novamente.';
            } else if (!response.ok) {
                respostaTexto = 'Desculpe, não consegui responder agora. Tente novamente em instantes.';
            } else {
                const data = await response.json();
                respostaTexto = data.resposta ?? 'Desculpe, não consegui processar sua pergunta.';
            }

            setMensagens((prev) => [...prev, { autor: 'dininho', texto: respostaTexto }]);

            if (!aberto) {
                setTemMensagemNaoLida(true);
            }
        } catch {
            setMensagens((prev) => [
                ...prev,
                { autor: 'dininho', texto: 'Desculpe, não consegui responder agora. Verifique sua conexão.' },
            ]);

            if (!aberto) {
                setTemMensagemNaoLida(true);
            }
        } finally {
            setCarregando(false);
        }
    };

    const limparConversa = () => {
        setMensagens([]);

        try {
            sessionStorage.removeItem(CHAVE_STORAGE);
        } catch {
            // ignora falha ao limpar o storage — o estado em memória já foi zerado
        }
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={alternarChat}
                aria-label={aberto ? 'Fechar assistente Dininho' : 'Abrir assistente Dininho'}
                className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-600"
            >
                {aberto ? <X className="size-6" /> : <MessageCircle className="size-6" />}
                {!aberto && temMensagemNaoLida && (
                    <span className="absolute top-1 right-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>

            {/* Janela de chat */}
            {aberto && (
                <div
                    role="dialog"
                    aria-label="Chat com o assistente Dininho"
                    className="fixed right-6 bottom-24 z-50 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
                >
                    <div className="flex items-center justify-between border-b border-border/70 bg-emerald-500/10 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Dininho</h3>
                            <p className="text-xs text-muted-foreground">Assistente do PayFlow</p>
                        </div>
                        {mensagens.length > 0 && (
                            <button
                                onClick={limparConversa}
                                aria-label="Limpar conversa"
                                title="Limpar conversa"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-emerald-500/20 hover:text-foreground"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {mensagens.length === 0 && (
                            <p className="text-center text-xs text-muted-foreground">
                                Oi! Sou o Dininho. Pode perguntar sobre o sistema.
                            </p>
                        )}
                        {mensagens.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                                    msg.autor === 'usuario'
                                        ? 'ml-auto bg-emerald-500 text-white'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                {msg.texto}
                            </div>
                        ))}
                        {carregando && (
                            <div className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-current" />
                            </div>
                        )}
                        <div ref={fimDaListaRef} />
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/70 p-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={pergunta}
                            onChange={(e) => setPergunta(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()}
                            placeholder="Digite sua pergunta..."
                            maxLength={MAX_CARACTERES}
                            disabled={carregando}
                            className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500/40 disabled:opacity-60"
                        />
                        <button
                            onClick={enviarPergunta}
                            disabled={carregando || !pergunta.trim()}
                            aria-label="Enviar pergunta"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white disabled:opacity-50"
                        >
                            <Send className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
