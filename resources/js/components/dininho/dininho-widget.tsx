import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Mensagem {
    autor: 'usuario' | 'dininho';
    texto: string;
}

export default function DininhoWidget() {
    const [aberto, setAberto] = useState(false);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [pergunta, setPergunta] = useState('');
    const [carregando, setCarregando] = useState(false);

    const enviarPergunta = async () => {
        if (!pergunta.trim() || carregando) return;

        const perguntaAtual = pergunta;
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
                body: JSON.stringify({ pergunta: perguntaAtual }),
            });

            const data = await response.json();

            setMensagens((prev) => [...prev, { autor: 'dininho', texto: data.resposta }]);
        } catch (error) {
            setMensagens((prev) => [
                ...prev,
                { autor: 'dininho', texto: 'Desculpe, não consegui responder agora.' },
            ]);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setAberto(!aberto)}
                className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:bg-emerald-600"
            >
                {aberto ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </button>

            {/* Janela de chat */}
            {aberto && (
                <div className="fixed right-6 bottom-24 z-50 flex h-[480px] w-80 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl">
                    <div className="border-b border-border/70 bg-emerald-500/10 px-4 py-3">
                        <h3 className="text-sm font-bold text-foreground">Dininho</h3>
                        <p className="text-xs text-muted-foreground">Assistente do PayFlow</p>
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
                                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                    msg.autor === 'usuario'
                                        ? 'ml-auto bg-emerald-500 text-white'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                {msg.texto}
                            </div>
                        ))}
                        {carregando && (
                            <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                                Digitando...
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/70 p-3">
                        <input
                            type="text"
                            value={pergunta}
                            onChange={(e) => setPergunta(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()}
                            placeholder="Digite sua pergunta..."
                            className="flex-1 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
                        />
                        <button
                            onClick={enviarPergunta}
                            disabled={carregando}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white disabled:opacity-50"
                        >
                            <Send className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}