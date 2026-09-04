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

        return [];
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

    /**
     * Nomes amigáveis para os campos aninhados de veiculo/residencia — sem
     * isso, a mensagem de erro mostraria o caminho cru ("veiculo.placa").
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
        ];
    }
}
