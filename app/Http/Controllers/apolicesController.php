<?php

namespace App\Http\Controllers;
use App\Services\ApoliceService;
use App\Http\Requests\StoreApoliceRequest;
use App\Http\Controllers\Controller;


class ApolicesController extends Controller
{
    //1. Declarar service como propriedade
    protected ApoliceService $apoliceService;

    //2. Injetar a dependencia por meio do construtor
    public function __construct(ApoliceService $apoliceService){
        //3. Atribuir a propriedade a instancia do service
        //significa que a propriedade $apoliceService da classe ApolicesController vai receber a instancia do ApoliceService que foi injetada pelo construtor
        //ou seja essa classe tem acesso a todos os dados e funções do service, e pode usar ele para realizar as operações relacionadas a apolices, como cadastrar, buscar, etc
        $this->apoliceService = $apoliceService;
    }

    //3. Usar o service no método store
    public function store(StoreApoliceRequest $request){
        //Aqui a gente pega os dados do request, valida eles e depois chama o método store do service passando os dados validados
        try{
            $data = $request->validated();
            $this->apoliceService->store($data);
            return redirect()->back()->with('success', 'Apólice cadastrada com sucesso!');
        }catch(\Exception $e){
            return redirect()->back()->with('error', 'Erro ao cadastrar apólice: ' . $e->getMessage());
        }
    }

    public function index(){
    $segurados = $this->apoliceService->buscar();
    $total = $this->apoliceService->count();
    $seguradoras = $this->apoliceService->buscarSeguradoras();
    $ramos = $this->apoliceService->buscarRamos();
    $apolices = $this->apoliceService->buscarApolices();

    return inertia('FunctionsApp/apolices', [
        'segurados' => $segurados,
        'total' => $total,
        'seguradoras' => $seguradoras,
        'ramos' => $ramos,
        'apolices' => $apolices,
    ]);
}
}