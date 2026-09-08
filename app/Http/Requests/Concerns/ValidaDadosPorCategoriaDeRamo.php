<?php

namespace App\Http\Requests\Concerns;

use App\Models\Ramo;

/**
 * Regras de validação dos dados extras de veículo/residência, compartilhadas
 * entre StoreApoliceRequest e UpdateApoliceRequest — mantidas num único
 * lugar para não repetir a mesma lista de ~30 campos nos dois arquivos.
 */
trait ValidaDadosPorCategoriaDeRamo
{
    private function regrasPorCategoriaDoRamo(?int $ramoId): array
    {
        $categoria = Ramo::find($ramoId)?->categoria;

        if ($categoria === Ramo::CATEGORIA_VEICULO) {
            return $this->regrasVeiculo();
        }

        if ($categoria === Ramo::CATEGORIA_RESIDENCIAL) {
            return $this->regrasResidencia();
        }

        if ($categoria === Ramo::CATEGORIA_VIDA) {
            return $this->regrasVida();
        }

        if ($categoria === Ramo::CATEGORIA_EMPRESARIAL) {
            return $this->regrasEmpresarial();
        }

        return [];
    }

    /**
     * Depois que o Validator já rodou as regras "normais", confere a regra de
     * negócio que não dá pra expressar como uma regra por campo: a soma dos
     * percentuais de indenização de todos os beneficiários de uma apólice de
     * vida precisa fechar em 100% — senão a indenização fica mal definida.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $categoria = Ramo::find($this->input('ramo_id'))?->categoria;

            if ($categoria !== Ramo::CATEGORIA_VIDA) {
                return;
            }

            $beneficiarios = $this->input('beneficiarios', []);
            $soma = round(
                collect($beneficiarios)->sum(fn ($b) => (float) ($b['percentual_indenizacao'] ?? 0)),
                2
            );

            if (abs($soma - 100.0) > 0.01) {
                $validator->errors()->add(
                    'beneficiarios',
                    'A soma dos percentuais de indenização dos beneficiários precisa ser 100% (está em '.number_format($soma, 2, ',', '.').'%).'
                );
            }
        });
    }

    private function regrasVeiculo(): array
    {
        return [
            'veiculo' => 'required|array',
            'veiculo.tipo_veiculo' => 'required|string|in:carro,moto,caminhonete,caminhao,outro',
            'veiculo.placa' => 'required|string|max:8',
            'veiculo.renavam' => 'required|string|max:11',
            'veiculo.chassi' => 'required|string|max:17',
            'veiculo.marca' => 'required|string|max:50',
            'veiculo.modelo' => 'required|string|max:100',
            'veiculo.ano_fabricacao' => 'required|integer|min:1950|max:'.(date('Y') + 1),
            'veiculo.ano_modelo' => 'required|integer|min:1950|max:'.(date('Y') + 1),
            'veiculo.cor' => 'required|string|max:30',
            'veiculo.combustivel' => 'required|string|in:gasolina,etanol,flex,diesel,eletrico,hibrido',
            'veiculo.uso' => 'required|string|in:particular,comercial,aplicativo',
            'veiculo.cep_pernoite' => 'required|string|max:15',
            'veiculo.possui_rastreador' => 'nullable|boolean',
            'veiculo.nome_condutor_principal' => 'nullable|string|max:255',
            'veiculo.cpf_condutor_principal' => 'nullable|string|max:20',
            'veiculo.data_nascimento_condutor_principal' => 'nullable|date',
        ];
    }

    private function regrasResidencia(): array
    {
        return [
            'residencia' => 'required|array',
            'residencia.tipo_imovel' => 'required|string|in:casa,apartamento,sobrado,outro',
            'residencia.tipo_construcao' => 'required|string|in:alvenaria,madeira,mista',
            'residencia.endereco_imovel' => 'required|string',
            'residencia.numero' => 'required|string|max:20',
            'residencia.complemento' => 'nullable|string|max:100',
            'residencia.bairro_imovel' => 'required|string|max:100',
            'residencia.cidade_imovel' => 'required|string|max:100',
            'residencia.estado_imovel' => 'required|string|size:2',
            'residencia.cep_imovel' => 'required|string|max:15',
            'residencia.area_construida_m2' => 'required|numeric|min:1',
            'residencia.ano_construcao' => 'nullable|integer|min:1900|max:'.(date('Y') + 1),
            'residencia.ocupacao' => 'required|string|in:residencia_habitual,veraneio,alugado,desocupado',
            'residencia.possui_sistema_seguranca' => 'nullable|boolean',
        ];
    }

    private function regrasVida(): array
    {
        return [
            'vida' => 'required|array',
            'vida.profissao' => 'required|string|max:150',
            'vida.possui_atividade_profissional_risco' => 'nullable|boolean',
            'vida.fumante' => 'nullable|boolean',
            'vida.possui_doenca_preexistente' => 'nullable|boolean',
            // Só exige a descrição se a pessoa marcou que tem doença preexistente
            'vida.descricao_doencas' => 'required_if:vida.possui_doenca_preexistente,true|nullable|string',
            'vida.pratica_esporte_risco' => 'nullable|boolean',
            // Idem: só exige qual esporte se marcou que pratica esporte de risco
            'vida.qual_esporte' => 'required_if:vida.pratica_esporte_risco,true|nullable|string|max:150',
            'vida.capital_segurado' => 'required|numeric|min:0.01',

            // Beneficiários: lista de pelo menos 1, cada um com seus próprios campos
            'beneficiarios' => 'required|array|min:1',
            'beneficiarios.*.nome_completo' => 'required|string|max:255',
            'beneficiarios.*.cpf' => 'required|string|max:20',
            'beneficiarios.*.data_nascimento' => 'required|date',
            'beneficiarios.*.parentesco' => 'required|string|in:conjuge,filho,pai,mae,irmao,outro',
            'beneficiarios.*.percentual_indenizacao' => 'required|numeric|min:0.01|max:100',
        ];
    }

    private function regrasEmpresarial(): array
    {
        return [
            'empresarial' => 'required|array',
            'empresarial.cnae_ou_atividade' => 'required|string|max:255',
            'empresarial.numero_funcionarios' => 'required|integer|min:0',
            'empresarial.valor_patrimonio_segurado' => 'required|numeric|min:0',
            'empresarial.faturamento_anual' => 'required|numeric|min:0',
            'empresarial.possui_cobertura_incendio_basica' => 'nullable|boolean',
            'empresarial.coberturas_adicionais' => 'nullable|string',
            'empresarial.endereco_estabelecimento' => 'required|string',
            'empresarial.numero_estabelecimento' => 'required|string|max:20',
            'empresarial.bairro_estabelecimento' => 'required|string|max:100',
            'empresarial.cidade_estabelecimento' => 'required|string|max:100',
            'empresarial.estado_estabelecimento' => 'required|string|size:2',
            'empresarial.cep_estabelecimento' => 'required|string|max:15',
        ];
    }

    /**
     * Nomes amigáveis para os campos aninhados de veiculo/residencia/vida/
     * empresarial — sem isso, a mensagem de erro mostraria o caminho cru
     * ("veiculo.placa").
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'veiculo.tipo_veiculo' => 'tipo de veículo',
            'veiculo.placa' => 'placa',
            'veiculo.renavam' => 'Renavam',
            'veiculo.chassi' => 'chassi',
            'veiculo.marca' => 'marca',
            'veiculo.modelo' => 'modelo',
            'veiculo.ano_fabricacao' => 'ano de fabricação',
            'veiculo.ano_modelo' => 'ano do modelo',
            'veiculo.cor' => 'cor',
            'veiculo.combustivel' => 'combustível',
            'veiculo.uso' => 'uso do veículo',
            'veiculo.cep_pernoite' => 'CEP de pernoite',

            'residencia.tipo_imovel' => 'tipo de imóvel',
            'residencia.tipo_construcao' => 'tipo de construção',
            'residencia.endereco_imovel' => 'endereço do imóvel',
            'residencia.numero' => 'número',
            'residencia.bairro_imovel' => 'bairro do imóvel',
            'residencia.cidade_imovel' => 'cidade do imóvel',
            'residencia.estado_imovel' => 'estado do imóvel',
            'residencia.cep_imovel' => 'CEP do imóvel',
            'residencia.area_construida_m2' => 'área construída',
            'residencia.ocupacao' => 'ocupação do imóvel',

            'vida.profissao' => 'profissão',
            'vida.descricao_doencas' => 'descrição das doenças preexistentes',
            'vida.qual_esporte' => 'qual esporte de risco',
            'vida.capital_segurado' => 'capital segurado',
            'beneficiarios.*.nome_completo' => 'nome do beneficiário',
            'beneficiarios.*.cpf' => 'CPF do beneficiário',
            'beneficiarios.*.data_nascimento' => 'data de nascimento do beneficiário',
            'beneficiarios.*.parentesco' => 'parentesco do beneficiário',
            'beneficiarios.*.percentual_indenizacao' => 'percentual de indenização',

            'empresarial.cnae_ou_atividade' => 'CNAE/atividade',
            'empresarial.numero_funcionarios' => 'número de funcionários',
            'empresarial.valor_patrimonio_segurado' => 'valor do patrimônio segurado',
            'empresarial.faturamento_anual' => 'faturamento anual',
            'empresarial.endereco_estabelecimento' => 'endereço do estabelecimento',
            'empresarial.numero_estabelecimento' => 'número do estabelecimento',
            'empresarial.bairro_estabelecimento' => 'bairro do estabelecimento',
            'empresarial.cidade_estabelecimento' => 'cidade do estabelecimento',
            'empresarial.estado_estabelecimento' => 'estado do estabelecimento',
            'empresarial.cep_estabelecimento' => 'CEP do estabelecimento',
        ];
    }
}
