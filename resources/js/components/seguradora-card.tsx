import React from "react";

interface Ramo {
  id: number;
  nome_ramo: string;
}

interface Seguradora {
  id: number;
  nome_fantasia: string;
  ativo: boolean;
  ramos: Ramo[];
}

interface SeguradoraCardProps {
  seguradora: Seguradora;
}

export function SeguradoraCard({ seguradora }: SeguradoraCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-card-foreground">
          {seguradora.nome_fantasia}
        </h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            seguradora.ativo
              ? "bg-green-500/10 text-green-500 animate-[pulse_1.5s_infinite] shadow-[0_0_15px_rgba(239,68,68,0.7)] text-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {seguradora.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}