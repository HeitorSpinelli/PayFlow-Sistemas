<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAutomacaoRequest;
use App\Models\Automacao;
use Illuminate\Http\Request;

class AutomacoesController extends Controller
{
    public function index(Request $request)
    {
        $automacoes = Automacao::with('tipoNotificacao')->get();

        return $automacoes;
    }

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
                'user_id'             => auth()->id(),
                'tipo_condicao'       => $request->tipo_condicao,
                'dias'                => $request->dias,
                'canal'               => $request->canal,
                'tipo_notificacao_id' => $request->tipo_notificacao_id,
                'mensagem'            => $request->mensagem,
                'ativo'               => $request->ativo ?? true,
            ]);
            return redirect()->back()->with('success', 'Automação criada com sucesso!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao criar automação: ' . $e->getMessage());
        }
    }
    public function update(StoreAutomacaoRequest $request, string $id)
    {
        try {
            $automacao = Automacao::findOrFail($id);
            $automacao->update($request->validated());
            return redirect()->back()->with('success', 'Automação atualizada!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao atualizar: ' . $e->getMessage());
        }
    }

    public function toggle(Request $request, string $id)
    {

        try {
            $ativo = Automacao::findOrFail($id);

            $request->validate([
                'ativo' => 'required|boolean'
            ]);
            $ativo->update([
                'ativo' => $request->ativo
            ]);
            return redirect()->back()->with('success', 'Status Atualizado');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erros ao atualizar status');
        }
    }

    public function destroy(string $id)
    {
        try {
            $automacao = Automacao::findOrFail($id);
            $automacao->delete();
            return redirect()->back()->with('success', 'Automação excluída');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erro ao excluir automação: ' . $e->getMessage());
        }
    }
}