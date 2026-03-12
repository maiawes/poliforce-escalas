"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useMonthlyData } from "@/hooks/use-monthly-data";
import { useSettings } from "@/hooks/use-settings";
import { formatMonthLabel, toMonthKey } from "@/lib/shifts/formatters";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ShiftList } from "@/components/shifts/shift-list";

export default function Page() {
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const { shifts } = useMonthlyData(monthKey);
  const { settings } = useSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação"
        title="Escalas do mês"
        description={`Veja todas as escalas lançadas em ${formatMonthLabel(monthKey)} com filtros e ações rápidas.`}
        actions={
          <Link href="/escalas/nova">
            <Button>
              <PlusCircle size={16} />
              Nova escala
            </Button>
          </Link>
        }
      />
      <ShiftList shifts={shifts} settings={settings} monthKey={monthKey} onMonthChange={setMonthKey} />
    </div>
  );
}
