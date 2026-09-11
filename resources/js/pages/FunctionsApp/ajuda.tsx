import { Head, usePage } from '@inertiajs/react';
import { BookOpen, ChevronDown, ChevronRight, Download, FileText, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ------------------------------------------------------------------ */
/* Manual do usuário                                                  */
/* ------------------------------------------------------------------ */

interface ManualSecao {
    id: string;
    titulo: string;
    resumo: string;
    conteudo: string[];
}

const MANUAL: ManualSecao[] = [
    {
        id: 'dashboard',
        titulo: 'Dashboard',
        resumo: 'Visão geral do escritório: indicadores, apólices e cobranças em destaque.',
        conteudo: [
            'A Dashboard é a tela inicial após o login e reúne um resumo do seu escritório: quantidade de clientes, apólices ativas, valores a receber e cobranças em atraso.',
            'Use os cartões e gráficos da Dashboard para identificar rapidamente o que precisa de atenção no dia, sem precisar abrir cada módulo separadamente.',
        ],
    },
    {
        id: 'clientes',
        titulo: 'Clientes (Segurados)',
        resumo: 'Cadastro, edição, exportação e restauração de clientes.',
        conteudo: [
            'Em "Clientes" você cadastra e mantém os dados dos segurados (nome, contato, documentos, etc).',
            'É possível editar um cliente já cadastrado, excluí-lo (o que move o registro para "Inativos") e restaurá-lo depois em "Clientes inativos", caso a exclusão tenha sido por engano.',
            'O botão "Exportar" gera uma planilha com a lista de clientes cadastrados, útil para relatórios ou conferências fora do sistema.',
        ],
    },
    {
        id: 'apolices',
        titulo: 'Apólices',
        resumo: 'Cadastro, ativação, renovação e alteração de ramo das apólices.',
        conteudo: [
            'O módulo "Apólices" concentra todas as apólices vinculadas aos clientes: seguradora, ramo, vigência e valores.',
            'Uma apólice pode ser ativada, renovada (gerando uma nova vigência) ou ter o ramo alterado sem precisar recriar o registro do zero.',
            'Apólices excluídas também podem ser restauradas, e a lista completa pode ser exportada para planilha a qualquer momento.',
            'Quando o cliente fica inadimplente, as automações do sistema podem suspender ou cancelar a apólice automaticamente — veja a seção "Notificações e Automações" para entender essas regras.',
        ],
    },
    {
        id: 'pagamentos',
        titulo: 'Pagamentos',
        resumo: 'Lançamento e consulta de pagamentos por cliente.',
        conteudo: [
            'Em "Pagamentos" você registra os pagamentos recebidos referentes às parcelas das apólices.',
            'É possível consultar o histórico de pagamentos filtrando por cliente, excluir um lançamento feito por engano, e exportar a lista de pagamentos.',
        ],
    },
    {
        id: 'agenda',
        titulo: 'Agenda',
        resumo: 'Calendário mensal com as cobranças a vencer, pagas e em atraso.',
        conteudo: [
            'A "Agenda" mostra um calendário do mês com as cobranças de cada dia, coloridas por status: pago (verde), a vencer (amarelo) e em atraso (vermelho).',
            'Clique em um dia com cobranças para ver o detalhe de cada cliente, apólice, parcela e valor daquele dia.',
            'Os cartões no topo da Agenda resumem o total a receber, o total em atraso e o total já recebido no mês selecionado.',
        ],
    },
    {
        id: 'importar',
        titulo: 'Importar',
        resumo: 'Importação em massa de clientes e apólices via planilha.',
        conteudo: [
            'A tela "Importar" permite subir uma planilha para cadastrar vários clientes ou apólices de uma vez, em vez de digitar um por um.',
            'Depois de importar, o sistema mostra um resumo com quantos registros foram importados com sucesso e quais tiveram problema.',
        ],
    },
    {
        id: 'notificacoes',
        titulo: 'Notificações e Automações',
        resumo: '(Administradores) Envio de notificações e regras automáticas de cobrança.',
        conteudo: [
            'O módulo "Notificações" (visível apenas para administradores) mostra quantas notificações foram enviadas, quantas estão pendentes e quantas falharam.',
            'Em "Tipos de Notificação" é possível cadastrar os modelos de mensagem usados nos disparos automáticos.',
            'Em "Automações" ficam as regras que disparam notificações e ações sozinhas — por exemplo, avisar o cliente antes do vencimento, cobrar quem está inadimplente e suspender ou cancelar automaticamente a apólice de clientes que continuam sem pagar.',
        ],
    },
    {
        id: 'seguradoras',
        titulo: 'Seguradoras e Ramos',
        resumo: '(Administradores) Cadastro das seguradoras parceiras e seus ramos.',
        conteudo: [
            'Em "Seguradoras e Ramos" (apenas administradores) você cadastra as seguradoras com as quais o escritório trabalha e os ramos de seguro oferecidos por cada uma.',
            'Essas informações alimentam os formulários de cadastro de apólice em todo o sistema.',
        ],
    },
    {
        id: 'administracao',
        titulo: 'Administração de Usuários',
        resumo: '(Administradores) Gestão dos usuários que acessam o sistema.',
        conteudo: [
            'Em "Administração" o administrador gerencia os usuários que têm acesso ao PayFlow, podendo editar dados e permissões de cada um.',
        ],
    },
];

/* ------------------------------------------------------------------ */
/* Manual (accordion)                                                 */
/* ------------------------------------------------------------------ */

function ManualAccordion() {
    const [aberta, setAberta] = useState<string | null>(MANUAL[0].id);

    return (
        <div className="flex flex-col gap-3">
            {MANUAL.map((secao) => {
                const isOpen = aberta === secao.id;

                return (
                    <Collapsible key={secao.id} open={isOpen} onOpenChange={(open) => setAberta(open ? secao.id : null)}>
                        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                            <CollapsibleTrigger asChild>
                                <button className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5">
                                    <div>
                                        <p className="text-sm font-bold text-foreground sm:text-base">{secao.titulo}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{secao.resumo}</p>
                                    </div>
                                    <ChevronDown
                                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="space-y-2 border-t border-border/70 px-4 py-4 sm:px-5">
                                    {secao.conteudo.map((paragrafo, idx) => (
                                        <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
                                            {paragrafo}
                                        </p>
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Página principal                                                   */
/* ------------------------------------------------------------------ */

export default function Ajuda() {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';

    return (
        <>
            <Head title="Ajuda" />

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                        <span>Suporte</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>Ajuda</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Central de Ajuda</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Manual do usuário e documentação do projeto.</p>
                </div>

                {isAdmin ? (
                    <Tabs defaultValue="manual">
                        <TabsList>
                            <TabsTrigger value="manual">
                                <BookOpen className="mr-1.5 size-4" />
                                Manual do Usuário
                            </TabsTrigger>
                            <TabsTrigger value="tcc">
                                <GraduationCap className="mr-1.5 size-4" />
                                Documentação do TCC
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual">
                            <ManualAccordion />
                        </TabsContent>

                        <TabsContent value="tcc">
                            <Card className="rounded-2xl border-border/70">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="size-5 text-emerald-600" />
                                        Documentação do TCC — PayFlow
                                    </CardTitle>
                                    <CardDescription>
                                        Trabalho de Conclusão de Curso que descreve o sistema, sua motivação,
                                        requisitos e desenvolvimento. Visível apenas para administradores.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <a href="/ajuda/documentacao-tcc">
                                        <Button className="rounded-xl bg-emerald-500 font-bold hover:bg-emerald-600">
                                            <Download className="mr-2 size-4" />
                                            Baixar documentação (.docx)
                                        </Button>
                                    </a>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <ManualAccordion />
                )}
            </div>
        </>
    );
}
