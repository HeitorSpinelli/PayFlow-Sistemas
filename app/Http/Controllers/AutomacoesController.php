<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAutomacaoRequest;
use App\Models\Automacao;
use Illuminate\Http\Request;

/**
 * Controller das automações de notificação (envio automático por condição,
 * ex.: X dias antes do vencimento). Usado pelo modal de configurações da
 * tela Notificações (configuracoes-notificacoes-modal.tsx) e pelos toggles
 * da lista de automações da própria tela. Quem executa as automações é o
 * job ProcessarAutomacoes (agendado às 08:00), não este controller.
 */
class AutomacoesController extends Controller
{
    /**
     * Lista as automações em JSON (GET /automacoes). Nenhuma tela chama esta
     * rota hoje: a tela Notificações já recebe 'automacoes' direto na rota
     * /notificacoes (routes/web.php).
     */
    public function index(Request $request)
    {
        $automacoes = Automacao::with('tipoNotificacao')->get();

        return $automacoes;
    }

    /**
     * Cria uma automação pelo formulário do modal de configurações da tela
     * Notificações. Bloqueia duplicata (mesma condição + canal + tipo) com toast
     * de erro.
     */
    public function store(StoreAutomacaoRequest $request)
    {
        try {
            $jaExiste = Automacao::where('tipo_condicao', $request->tipo_condicao)
                ->where('canal', $request->canal)
                ->where('tipo_notificacao_id', $request->tipo_notificacao_id)
                ->exists();

            if ($jaExiste) {
                return redirect()->back()->with('error', 'Já existe uma automação com essa condição, canal e tipo.');
            }

            Automacao::create([
                'user_id' => auth()->id(),
                'tipo_condicao' => $request->tipo_condicao,
                'dias' => $request->dias,
                'intervalo_dias' => $request->intervalo_dias,
                'canal' => $request->canal,
                'tipo_notificacao_id' => $request->tipo_notificacao_id,
                'mensagem' => $request->mensagem,
                'ativo' => $request->ativo ?? true,
            ]);

            return redirect()->back()->with('success', 'Automação criada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao criar automação: '.$e->getMessage());
        }
    }

    /**
     * Edita uma automação (PUT /automacoes/{id}). Nenhuma tela chama esta rota
     * hoje — o modal só cria, liga/desliga e exclui.
     */
    public function update(StoreAutomacaoRequest $request, string $id)
    {
        try {
            $automacao = Automacao::findOrFail($id);
            $automacao->update($request->validated());

            return redirect()->back()->with('success', 'Automação atualizada!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar: '.$e->getMessage());
        }
    }

    /**
     * Liga/desliga uma automação — switch da aba "Automações" da tela
     * Notificações e do modal de configurações de notificação.
     */
    public function toggle(Request $request, string $id)
    {

        try {
            $ativo = Automacao::findOrFail($id);

            $request->validate([
                'ativo' => 'required|boolean',
            ]);
            $ativo->update([
                'ativo' => $request->ativo,
            ]);

            return redirect()->back()->with('success', 'Status Atualizado');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erros ao atualizar status');
        }
    }

    /**
     * Exclui uma automação pelo botão de lixeira do modal de configurações da
     * tela Notificações.
     */
    public function destroy(string $id)
    {
        try {
            $automacao = Automacao::findOrFail($id);
            $automacao->delete();

            return redirect()->back()->with('success', 'Automação excluída');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir automação: '.$e->getMessage());
        }
    }
}
