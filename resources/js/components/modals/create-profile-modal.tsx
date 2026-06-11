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

// ─────────────────────────────────────────────────────────────
// Define os 3 estados possíveis do modal
// O modal só pode estar em um desses três modos por vez
// ─────────────────────────────────────────────────────────────
type Modo = 'visualizar' | 'editar' | 'excluir';

export default function SeguradoProfileModal({ open, setOpen, segurado }: any) {

    // Controla em qual modo o modal está no momento
    // Sempre começa em 'visualizar' quando abre
    const [modo, setModo] = useState<Modo>('visualizar');

    // useForm do Inertia — gerencia os campos do formulário de edição
    // Cada campo começa com o valor atual do segurado
    // O ?. evita erro se segurado for null (ex: antes de carregar)
    // O ?? '' garante que nunca fica undefined — usa string vazia como padrão
    const { data, setData, put, processing } = useForm({
        nome_completo:             segurado?.nome_completo            ?? '',
        cpf_cnpj:                  segurado?.cpf_cnpj                 ?? '',
        tipo_pessoa:               segurado?.tipo_pessoa              ?? '',
        data_nascimento_fundacao:  segurado?.data_nascimento_fundacao ?? '',
        email:                     segurado?.email                    ?? '',
        telefone_fixo:             segurado?.telefone_fixo            ?? '',
        celular_whatsapp:          segurado?.celular_whatsapp         ?? '',
        endereco:                  segurado?.endereco                 ?? '',
        cidade:                    segurado?.cidade                   ?? '',
        estado:                    segurado?.estado                   ?? '',
        cep:                       segurado?.cep                      ?? '',
        status:                    segurado?.status                   ?? '',
        observacoes:               segurado?.observacoes              ?? '',
    });

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
        put(`/clientes/${segurado.id}`, {
            onSuccess: () => fechar(),
        });
    };

    // Envia a requisição de exclusão para o Laravel via DELETE
    // DELETE /clientes/{id} — remove o segurado do banco
    // Se der certo (onSuccess), fecha o modal
    const confirmarExclusao = () => {
        router.delete(`/clientes/${segurado.id}`, {
            onSuccess: () => fechar(),
        });
    };

    return (
        <Dialog open={open} onOpenChange={fechar}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* ── HEADER ──
                    Sempre visível independente do modo
                    Mostra a inicial do nome em um círculo verde
                    O título muda conforme o modo atual */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-3">

                        {/* Avatar com a primeira letra do nome */}
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-500 font-bold text-lg">
                                {segurado.nome_completo.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div>
                            {/* Título dinâmico — muda conforme o modo */}
                            <DialogTitle className="text-xl font-bold">
                                {modo === 'visualizar' && segurado.nome_completo}
                                {modo === 'editar'     && 'Editar Cliente'}
                                {modo === 'excluir'    && 'Excluir Cliente'}
                            </DialogTitle>

                            {/* Badge de status — verde se Ativo, vermelho se não */}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                segurado.status === 'Ativo'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-red-500/10 text-red-500'
                            }`}>
                                {segurado.status}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── MODO VISUALIZAR ──
                    Só renderiza quando modo === 'visualizar'
                    Exibe os dados do segurado em cards organizados por seção */}
                {modo === 'visualizar' && (
                    <div className="space-y-4">

                        {/* Seção: Identificação */}
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identificação</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                {/* Mostra "CPF" ou "CNPJ" dependendo do tipo de pessoa */}
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    {segurado.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}
                                </p>
                                <p className="text-sm font-medium">{segurado.cpf_cnpj || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                {/* Mostra "Nascimento" para pessoa física ou "Fundação" para jurídica */}
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    {segurado.tipo_pessoa === 'pf' ? 'Nascimento' : 'Fundação'}
                                </p>
                                <p className="text-sm font-medium">{segurado.data_nascimento_fundacao || 'Não informado'}</p>
                            </div>
                        </div>

                        {/* Seção: Contato */}
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm font-medium">{segurado.email || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">WhatsApp</p>
                                <p className="text-sm font-medium">{segurado.celular_whatsapp || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Telefone Fixo</p>
                                <p className="text-sm font-medium">{segurado.telefone_fixo || 'Não informado'}</p>
                            </div>
                        </div>

                        {/* Seção: Endereço */}
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço</p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* col-span-2 faz esse card ocupar as duas colunas */}
                            <div className="rounded-xl border border-muted-foreground/20 p-3 col-span-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Endereço</p>
                                <p className="text-sm font-medium">{segurado.endereco || 'Não informado'}</p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cidade / Estado</p>
                                <p className="text-sm font-medium">
                                    {segurado.cidade && segurado.estado
                                        ? `${segurado.cidade} - ${segurado.estado}`
                                        : 'Não informado'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-muted-foreground/20 p-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">CEP</p>
                                <p className="text-sm font-medium">{segurado.cep || 'Não informado'}</p>
                            </div>
                        </div>

                        {/* Seção: Observações
                            O && faz com que só renderize se o campo tiver valor
                            Se observacoes for null ou vazio, esse bloco inteiro some */}
                        {segurado.observacoes && (
                            <>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</p>
                                <div className="rounded-xl border border-muted-foreground/20 p-3">
                                    <p className="text-sm">{segurado.observacoes}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── MODO EDITAR ──
                    Só renderiza quando modo === 'editar'
                    Exibe inputs preenchidos com os dados atuais para o usuário alterar
                    Cada onChange chama setData para atualizar o campo no formulário */}
                {modo === 'editar' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">

                            {/* col-span-2 = ocupa as duas colunas da grid */}
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
                                {/* value={data.nome_completo} → mostra o valor atual
                                    onChange → atualiza o valor quando o usuário digita */}
                                <Input value={data.nome_completo} onChange={e => setData('nome_completo', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                                <Input value={data.email} onChange={e => setData('email', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp</label>
                                <Input value={data.celular_whatsapp} onChange={e => setData('celular_whatsapp', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone Fixo</label>
                                <Input value={data.telefone_fixo} onChange={e => setData('telefone_fixo', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
                                <Input value={data.cep} onChange={e => setData('cep', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Endereço</label>
                                <Input value={data.endereco} onChange={e => setData('endereco', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
                                <Input value={data.cidade} onChange={e => setData('cidade', e.target.value)} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</label>
                                {/* maxLength={2} limita a 2 caracteres — ex: SP, RJ */}
                                <Input value={data.estado} onChange={e => setData('estado', e.target.value)} className="h-11 rounded-xl" maxLength={2} />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
                                <textarea
                                    value={data.observacoes}
                                    onChange={e => setData('observacoes', e.target.value)}
                                    className="w-full min-h-[80px] rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MODO EXCLUIR ──
                    Só renderiza quando modo === 'excluir'
                    Exibe um aviso vermelho pedindo confirmação antes de deletar */}
                {modo === 'excluir' && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                        <p className="text-sm font-semibold text-red-500">Atenção — esta ação não pode ser desfeita.</p>
                        <p className="text-sm text-muted-foreground">
                            O cliente <span className="font-semibold text-foreground">{segurado.nome_completo}</span> e
                            todos os seus dados serão removidos permanentemente do sistema.
                        </p>
                    </div>
                )}

                {/* ── BOTÕES ──
                    Os botões também mudam conforme o modo
                    Cada modo tem seu próprio conjunto de ações */}
                <div className="flex justify-between mt-6">

                    {/* Botões Editar e Excluir — só aparecem no modo visualizar */}
                    {modo === 'visualizar' && (
                        <div className="flex gap-2">
                            {/* Troca para o modo editar */}
                            <Button variant="outline" onClick={() => setModo('editar')} className="rounded-xl">
                                Editar
                            </Button>
                            {/* Troca para o modo excluir */}
                            <Button variant="outline" onClick={() => setModo('excluir')} className="rounded-xl text-red-500 hover:text-red-500 border-red-500/30 hover:bg-red-500/10">
                                Excluir
                            </Button>
                        </div>
                    )}

                    {/* ml-auto empurra esse div para a direita */}
                    <div className="flex gap-2 ml-auto">

                        {/* Modo visualizar → só o botão Fechar */}
                        {modo === 'visualizar' && (
                            <Button variant="outline" onClick={fechar} className="rounded-xl">
                                Fechar
                            </Button>
                        )}

                        {/* Modo editar → Cancelar (volta para visualizar) + Salvar (envia PUT) */}
                        {modo === 'editar' && (
                            <>
                                <Button variant="outline" onClick={() => setModo('visualizar')} className="rounded-xl">
                                    Cancelar
                                </Button>
                                {/* disabled={processing} desabilita o botão enquanto a requisição está sendo enviada
                                    evita o usuário clicar duas vezes e duplicar a requisição */}
                                <Button onClick={salvarEdicao} disabled={processing} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
                                    Salvar alterações
                                </Button>
                            </>
                        )}

                        {/* Modo excluir → Cancelar (volta para visualizar) + Confirmar (envia DELETE) */}
                        {modo === 'excluir' && (
                            <>
                                <Button variant="outline" onClick={() => setModo('visualizar')} className="rounded-xl">
                                    Cancelar
                                </Button>
                                <Button onClick={confirmarExclusao} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
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