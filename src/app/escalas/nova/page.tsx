import { ShiftForm } from "@/components/shifts/shift-form";

export default function Page() {
  return (
    <ShiftForm
      title="Cadastrar nova escala"
      description="Registre uma escala simples ou dividida. O sistema calcula horas, valor proporcional e acumulado mensal automaticamente."
    />
  );
}
