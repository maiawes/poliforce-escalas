"use client";

import { useEffect, useState } from "react";
import { updateSettings } from "@/lib/firebase/firestore";
import { useSettings } from "@/hooks/use-settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsPage() {
  const { settings, loading } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando configurações...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Parâmetros"
        title="Configurações"
        description="Ajuste valores, bônus e horários padrão sem alterar o código da aplicação."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
            Segunda a quinta
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor da hora</label>
              <Input
                type="number"
                step="0.01"
                value={form.mondayToThursdayHourValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mondayToThursdayHourValue: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Bônus fixo</label>
              <Input
                type="number"
                step="0.01"
                value={form.mondayToThursdayBonus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mondayToThursdayBonus: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora inicial</label>
              <Input
                type="time"
                value={form.defaultStartTimeMondayToThursday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultStartTimeMondayToThursday: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora final</label>
              <Input
                type="time"
                value={form.defaultEndTimeMondayToThursday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultEndTimeMondayToThursday: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
            Sexta e sábado
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor da hora</label>
              <Input
                type="number"
                step="0.01"
                value={form.fridaySaturdayHourValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fridaySaturdayHourValue: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Bônus fixo</label>
              <Input
                type="number"
                step="0.01"
                value={form.fridaySaturdayBonus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fridaySaturdayBonus: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora inicial</label>
              <Input
                type="time"
                value={form.defaultStartTimeFridaySaturday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultStartTimeFridaySaturday: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora final</label>
              <Input
                type="time"
                value={form.defaultEndTimeFridaySaturday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultEndTimeFridaySaturday: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
            Domingo
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Valor da hora</label>
              <Input
                type="number"
                step="0.01"
                value={form.sundayHourValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sundayHourValue: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Bônus fixo</label>
              <Input
                type="number"
                step="0.01"
                value={form.sundayBonus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sundayBonus: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora inicial</label>
              <Input
                type="time"
                value={form.defaultStartTimeSunday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultStartTimeSunday: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Hora final</label>
              <Input
                type="time"
                value={form.defaultEndTimeSunday}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultEndTimeSunday: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </Card>
      </div>

      <Button onClick={handleSubmit} disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}
