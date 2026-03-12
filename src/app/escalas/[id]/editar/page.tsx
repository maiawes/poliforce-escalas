"use client";

import { useParams } from "next/navigation";
import { ShiftForm } from "@/components/shifts/shift-form";
import { useShift } from "@/hooks/use-shift";
import { DataState } from "@/components/ui/data-state";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { shift, loading } = useShift(params.id);

  if (loading) {
    return (
      <DataState
        title="Carregando escala"
        description="Buscando a escala e os blocos cadastrados para edição."
      />
    );
  }

  if (!shift) {
    return (
      <DataState
        title="Escala não encontrada"
        description="Não foi possível localizar a escala solicitada."
      />
    );
  }

  return (
    <ShiftForm
      title="Editar escala"
      description="Atualize horários, agentes e observações. Os valores serão recalculados antes de salvar."
      existingShift={shift}
    />
  );
}
