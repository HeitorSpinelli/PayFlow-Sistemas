// Texto dos documentos legais do PayFlow (janela de aceite no primeiro
// acesso e página /termos). Ao mudar algo relevante aqui, suba a 'versao'
// em config/termos.php — quem aceitou a versão anterior aceita de novo.
//
// Escrito a partir do que o sistema faz de fato: cadastro de segurados,
// apólices, parcelas e pagamentos; notificações por e-mail (Resend) e
// WhatsApp (link aberto pelo próprio usuário); assistente Dininho (Google
// Gemini, recebe só o texto da pergunta); indicadores Selic/IPCA do Banco
// Central; banco de dados no Supabase (São Paulo); hospedagem no Render;
// log de auditoria; cookies apenas essenciais.

// Ordem na tela: paragrafos, itens (lista) e nota (observação final).
export interface SecaoDocumento {
    titulo: string;
    paragrafos?: string[];
    itens?: string[];
    nota?: string;
}

export interface DocumentoLegal {
    id: 'termos' | 'privacidade' | 'confidencialidade';
    titulo: string;
    tituloCurto: string;
    resumo: string;
    secoes: SecaoDocumento[];
}

export interface ContextoTermos {
    responsavel: string;
    contato: string | null;
    versao: string;
    vigenteDesde: string;
}

export function documentosLegais(ctx: ContextoTermos): DocumentoLegal[] {
    const canal = ctx.contato
        ? `pelo e-mail ${ctx.contato}`
        : 'com o administrador do PayFlow na sua corretora';

    return [
        {
            id: 'termos',
            titulo: 'Termos de Uso',
            tituloCurto: 'Termos',
            resumo: 'As regras para usar o PayFlow: quem pode acessar, o que é permitido e as responsabilidades de cada um.',
            secoes: [
                {
                    titulo: '1. O que é o PayFlow',
                    paragrafos: [
                        `O PayFlow é um sistema web de gestão para corretoras de seguros, mantido por ${ctx.responsavel}. Ele reúne o cadastro de clientes (segurados), apólices, parcelas e pagamentos, a agenda de vencimentos, o envio de notificações de cobrança, a importação de planilhas, relatórios, o log de auditoria e o assistente virtual Dininho.`,
                        'Ao acessar o sistema, você declara que leu e concorda com estes Termos de Uso, com a Política de Privacidade e com o Termo de Confidencialidade. Se não concordar, não utilize o PayFlow.',
                    ],
                },
                {
                    titulo: '2. Quem pode usar',
                    itens: [
                        'O acesso é exclusivo para profissionais da corretora, com conta criada por um administrador do sistema.',
                        'Existem dois perfis: Administrador (acesso completo, incluindo usuários, seguradoras, notificações, exclusões e auditoria) e Usuário (operação do dia a dia).',
                        'É preciso ter 18 anos ou mais e usar o sistema apenas para fins profissionais.',
                    ],
                },
                {
                    titulo: '3. Sua conta e seu acesso',
                    itens: [
                        'Seu e-mail e sua senha são pessoais e intransferíveis. Não compartilhe sua conta com ninguém, nem com colegas.',
                        'Use uma senha forte e ative a autenticação em dois fatores em Configurações › Segurança.',
                        'A sessão é encerrada automaticamente após um período sem uso. Saia do sistema ao terminar, principalmente em computadores compartilhados.',
                        'Você responde pelas ações feitas com a sua conta. Todas elas ficam registradas no log de auditoria.',
                        'Se suspeitar de acesso indevido, troque a senha e avise um administrador imediatamente.',
                    ],
                },
                {
                    titulo: '4. Uso permitido',
                    paragrafos: [
                        'O PayFlow deve ser usado somente para gerir a carteira de clientes e de seguros da corretora. É proibido:',
                    ],
                    itens: [
                        'cadastrar informações falsas ou de pessoas sem relação com a corretora;',
                        'acessar, copiar ou exportar dados além do necessário para o seu trabalho;',
                        'enviar notificações sem base legal ou para quem não é cliente;',
                        'tentar burlar o controle de acesso, explorar falhas ou sobrecarregar o sistema;',
                        'usar robôs, extração automatizada de dados ou engenharia reversa do software.',
                    ],
                },
                {
                    titulo: '5. Dados dos clientes que você cadastra',
                    itens: [
                        'A corretora é responsável pela veracidade dos dados que insere e por ter base legal para tratá-los (por exemplo, a contratação ou a renovação do seguro).',
                        'Cadastre apenas o necessário. Evite colocar dados sensíveis, como informações de saúde, em campos livres como "Observações".',
                        'Importações por planilha passam por uma conferência automática, mas a conferência final dos dados é sua.',
                    ],
                },
                {
                    titulo: '6. Valores, cálculos e pagamentos',
                    itens: [
                        'O PayFlow registra e acompanha pagamentos, mas não é instituição financeira e não processa nem transfere dinheiro.',
                        'Parcelas em atraso recebem multa de 2% e juros de mora calculados com base na taxa legal (Selic menos IPCA, conforme o Código Civil), com índices obtidos no Banco Central. Os valores servem de apoio e devem ser conferidos com os documentos da seguradora.',
                        'Rotinas automáticas podem marcar parcelas como vencidas, suspender ou cancelar apólices por inadimplência e enviar avisos, conforme as regras configuradas no sistema.',
                    ],
                },
                {
                    titulo: '7. Notificações aos clientes',
                    itens: [
                        'E-mails são enviados por um provedor especializado em nome da corretora. Mensagens de WhatsApp são abertas no seu próprio WhatsApp, e é você quem confirma o envio.',
                        'Você é responsável pelo conteúdo das mensagens e por enviá-las apenas a clientes, em linguagem respeitosa e de acordo com o Código de Defesa do Consumidor.',
                    ],
                },
                {
                    titulo: '8. Assistente virtual Dininho',
                    itens: [
                        'O Dininho usa inteligência artificial (Google Gemini) para tirar dúvidas sobre o uso do sistema. As respostas podem conter erros e não substituem a sua conferência.',
                        'O texto das suas perguntas é enviado ao provedor de IA. Não digite CPF, dados de clientes ou senhas nas conversas.',
                    ],
                },
                {
                    titulo: '9. Auditoria',
                    paragrafos: [
                        'Para segurança e prestação de contas, o sistema registra quem criou, editou, excluiu, estornou ou restaurou cada registro, com data, hora e endereço IP. Os administradores podem consultar esse histórico.',
                    ],
                },
                {
                    titulo: '10. Disponibilidade',
                    paragrafos: [
                        'Fazemos o possível para manter o PayFlow disponível e seguro, mas podem ocorrer interrupções para manutenção, atualizações ou por falhas de serviços de terceiros, como hospedagem, banco de dados e e-mail.',
                    ],
                },
                {
                    titulo: '11. Propriedade intelectual',
                    paragrafos: [
                        `O software, a marca e o visual do PayFlow pertencem a ${ctx.responsavel}. Os dados cadastrados pertencem à corretora.`,
                    ],
                },
                {
                    titulo: '12. Suspensão e encerramento',
                    itens: [
                        'Administradores podem alterar o perfil ou remover contas de usuários.',
                        'O descumprimento destes termos pode levar ao bloqueio imediato do acesso, sem prejuízo de outras medidas cabíveis.',
                        'Você pode excluir a sua própria conta em Configurações › Perfil. Os registros de auditoria são preservados.',
                    ],
                },
                {
                    titulo: '13. Responsabilidades',
                    paragrafos: [
                        'O PayFlow é uma ferramenta de apoio à gestão. Decisões comerciais, cobranças, cancelamentos e comunicações com clientes e seguradoras continuam sob responsabilidade da corretora e de seus profissionais.',
                    ],
                },
                {
                    titulo: '14. Alterações e legislação',
                    itens: [
                        'Estes termos podem ser atualizados. Quando isso acontecer, o sistema pedirá um novo aceite no seu próximo acesso.',
                        'Aplica-se a legislação brasileira, em especial a LGPD (Lei 13.709/2018), o Marco Civil da Internet (Lei 12.965/2014) e o Código de Defesa do Consumidor.',
                        `Dúvidas sobre estes termos: entre em contato ${canal}.`,
                    ],
                },
            ],
        },
        {
            id: 'privacidade',
            titulo: 'Política de Privacidade',
            tituloCurto: 'Privacidade',
            resumo: 'Quais dados pessoais o PayFlow trata, para quê, com quem compartilha e como você exerce seus direitos pela LGPD.',
            secoes: [
                {
                    titulo: '1. A quem esta política se aplica',
                    paragrafos: [
                        'Esta política explica como o PayFlow trata dados pessoais em dois grupos: os usuários do sistema (profissionais da corretora) e os clientes da corretora cujos dados são cadastrados (segurados e beneficiários).',
                    ],
                },
                {
                    titulo: '2. Quem é responsável pelos dados',
                    paragrafos: [
                        `A corretora que utiliza o PayFlow é a controladora dos dados pessoais cadastrados: é ela quem decide quais dados coletar e para quê. ${ctx.responsavel}, que mantém o sistema, atua como operador, tratando os dados conforme as instruções da corretora e esta política.`,
                    ],
                },
                {
                    titulo: '3. Dados dos usuários do sistema',
                    itens: [
                        'Nome, e-mail e perfil de acesso (Administrador ou Usuário).',
                        'Senha, guardada apenas em formato criptografado (hash). Ninguém, nem os administradores, consegue vê-la.',
                        'Foto de perfil, se você enviar uma. Ela é exibida para os outros usuários do sistema.',
                        'Dados da autenticação em dois fatores, se ativada.',
                        'Registros de uso: ações feitas no sistema, data, hora e endereço IP (log de auditoria), além do aceite destes documentos (versão, data, hora e IP).',
                    ],
                },
                {
                    titulo: '4. Dados dos clientes da corretora',
                    itens: [
                        'Identificação: nome ou razão social, CPF ou CNPJ, data de nascimento ou de fundação.',
                        'Contato: e-mail, celular/WhatsApp, telefone fixo e endereço.',
                        'Seguros: apólices, seguradora, ramo, vigência, prêmio, cobertura e forma de pagamento.',
                        'Dados do bem segurado, conforme o ramo: veículo (placa, chassi, RENAVAM, condutor principal), residência, vida (beneficiários) ou empresa.',
                        'Financeiro: parcelas, vencimentos, pagamentos registrados e estornos.',
                        'Comunicação: histórico das notificações enviadas e o resultado de cada envio.',
                    ],
                    nota: 'O sistema não foi feito para guardar dados sensíveis, como dados de saúde, e só aceita clientes pessoa física maiores de 18 anos.',
                },
                {
                    titulo: '5. Para que usamos os dados e com qual base legal',
                    itens: [
                        'Gerir apólices, parcelas, pagamentos e renovações — execução de contrato (LGPD, art. 7º, V).',
                        'Enviar avisos de vencimento, atraso e renovação aos clientes — execução de contrato e legítimo interesse da corretora (art. 7º, V e IX).',
                        'Cobrar valores em atraso e guardar o histórico financeiro — exercício regular de direitos e cumprimento de obrigações legais e regulatórias do mercado de seguros (art. 7º, II e VI).',
                        'Manter a segurança, o controle de acesso e o log de auditoria — legítimo interesse e cumprimento de obrigação legal (art. 7º, II e IX; Marco Civil da Internet, art. 15).',
                        'Gerenciar as contas dos usuários — execução do contrato de trabalho ou de prestação de serviços com a corretora.',
                    ],
                    nota: 'O PayFlow não vende dados, não faz publicidade e não usa os dados para marketing de terceiros.',
                },
                {
                    titulo: '6. Com quem os dados são compartilhados',
                    paragrafos: [
                        'Para funcionar, o PayFlow conta com fornecedores que tratam dados apenas para prestar o serviço:',
                    ],
                    itens: [
                        'Supabase — banco de dados onde as informações ficam armazenadas, com servidores em São Paulo (Brasil).',
                        'Render — hospedagem da aplicação, que processa as requisições ao sistema.',
                        'Resend — envio dos e-mails de notificação: recebe o e-mail, o nome do cliente e o texto da mensagem.',
                        'Google (Gemini) — assistente Dininho: recebe somente o texto das perguntas digitadas, sem dados do banco.',
                        'WhatsApp — só quando o usuário abre o link de envio. A mensagem sai do aparelho do próprio usuário.',
                        'Banco Central do Brasil — consulta pública dos índices Selic e IPCA. Nenhum dado pessoal é enviado.',
                    ],
                },
                {
                    titulo: '7. Transferência internacional',
                    paragrafos: [
                        'Alguns fornecedores (Render, Resend e Google) podem processar dados fora do Brasil. Nesses casos, a transferência acontece para a prestação do serviço contratado e com fornecedores que adotam padrões de segurança e proteção de dados compatíveis com a LGPD (art. 33).',
                    ],
                },
                {
                    titulo: '8. Por quanto tempo guardamos',
                    itens: [
                        'Os dados ficam guardados enquanto a corretora usar o PayFlow e o relacionamento com o cliente existir, além dos prazos exigidos por lei, por exemplo para fins fiscais, regulatórios e de defesa em processos.',
                        'Exclusões feitas no sistema são, em geral, lógicas: o registro sai das telas, mas é preservado para permitir a restauração e manter o histórico financeiro e de auditoria.',
                        'Registros de acesso são mantidos por, no mínimo, 6 meses, como exige o Marco Civil da Internet.',
                    ],
                },
                {
                    titulo: '9. Como protegemos os dados',
                    itens: [
                        'Conexão criptografada (HTTPS) e senhas guardadas apenas em hash.',
                        'Autenticação em dois fatores disponível para todos os usuários.',
                        'Controle de acesso por perfil: funções sensíveis são exclusivas de administradores.',
                        'Log de auditoria de criações, edições, exclusões e estornos.',
                        'Limite de tentativas em ações sensíveis, cabeçalhos de segurança e encerramento da sessão por inatividade.',
                    ],
                },
                {
                    titulo: '10. Cookies',
                    paragrafos: [
                        'O PayFlow usa apenas cookies essenciais: o de sessão, que mantém você conectado; o de proteção contra falsificação de requisições (CSRF); e dois de preferência, que guardam o tema claro/escuro e o estado da barra lateral. Não usamos cookies de publicidade nem de rastreamento de terceiros.',
                    ],
                },
                {
                    titulo: '11. Seus direitos (LGPD, art. 18)',
                    paragrafos: [
                        'O titular dos dados pode pedir: confirmação de que seus dados são tratados; acesso; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação do que for desnecessário; portabilidade; informação sobre com quem os dados são compartilhados; e revisão de decisões automatizadas. Também pode se opor a tratamentos feitos com base no legítimo interesse.',
                        `Clientes da corretora devem fazer o pedido diretamente à corretora, que é a controladora dos dados. Usuários do sistema podem entrar em contato ${canal}. Também é possível reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
                    ],
                },
                {
                    titulo: '12. Incidentes de segurança',
                    paragrafos: [
                        'Se ocorrer um incidente que possa trazer risco ou dano relevante aos titulares, a corretora e os afetados serão avisados, e a ANPD será comunicada nos termos do art. 48 da LGPD, com as medidas adotadas para conter o problema.',
                    ],
                },
                {
                    titulo: '13. Atualizações e contato',
                    itens: [
                        `Esta é a versão ${ctx.versao}, vigente desde ${formatarData(ctx.vigenteDesde)}. Mudanças relevantes pedem um novo aceite no sistema.`,
                        `Dúvidas sobre privacidade ou sobre o encarregado de dados (DPO): entre em contato ${canal}.`,
                    ],
                },
            ],
        },
        {
            id: 'confidencialidade',
            titulo: 'Termo de Confidencialidade',
            tituloCurto: 'Sigilo',
            resumo: 'Seu compromisso de sigilo com os dados dos clientes, incluindo exportações, impressões e mensagens.',
            secoes: [
                {
                    titulo: '1. O que é confidencial',
                    paragrafos: [
                        'Todas as informações acessadas pelo PayFlow são confidenciais: dados pessoais dos clientes, apólices, valores, parcelas, pagamentos, relatórios, planilhas importadas ou exportadas, documentos impressos e as credenciais de acesso.',
                    ],
                },
                {
                    titulo: '2. Seu compromisso',
                    paragrafos: ['Ao usar o PayFlow, você se compromete a:'],
                    itens: [
                        'acessar apenas as informações necessárias para o seu trabalho;',
                        'não copiar, fotografar, divulgar ou compartilhar dados de clientes fora da corretora;',
                        'não levar dados para dispositivos ou contas pessoais, como e-mail particular, pen drives ou nuvens pessoais;',
                        'bloquear o computador ao se afastar e sair do sistema ao terminar;',
                        'não usar computadores públicos ou redes Wi-Fi abertas para acessar o sistema.',
                    ],
                },
                {
                    titulo: '3. Exportações, impressões e planilhas',
                    itens: [
                        'Arquivos exportados (CSV de clientes, apólices e pagamentos), fichas do segurado e cupons de parcela contêm dados pessoais e devem ser tratados como confidenciais.',
                        'Guarde-os apenas em locais autorizados pela corretora e apague ou destrua (no caso de papel) o que não for mais necessário.',
                        'Planilhas usadas na importação também contêm dados de clientes: não as envie a terceiros.',
                    ],
                },
                {
                    titulo: '4. Comunicação com clientes',
                    itens: [
                        'Antes de enviar uma notificação, confira se o destinatário é mesmo o cliente correto.',
                        'Nunca envie dados de um cliente para outro, nem inclua informações além do necessário na mensagem.',
                    ],
                },
                {
                    titulo: '5. Incidentes',
                    paragrafos: [
                        'Se perceber vazamento, perda de documentos, envio para o destinatário errado ou acesso indevido, avise um administrador imediatamente. A comunicação rápida é essencial para proteger os clientes e cumprir a LGPD.',
                    ],
                },
                {
                    titulo: '6. Vigência e descumprimento',
                    itens: [
                        'Este compromisso vale durante todo o período de acesso e continua depois que ele termina.',
                        'O descumprimento pode levar ao bloqueio do acesso e à responsabilização nas esferas trabalhista, civil e criminal, conforme a legislação.',
                    ],
                },
            ],
        },
    ];
}

// "2026-11-04" → "04/11/2026".
export function formatarData(iso: string) {
    const [ano, mes, dia] = iso.slice(0, 10).split('-');

    return `${dia}/${mes}/${ano}`;
}
