"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { saveAgent } from "@/lib/firebase/firestore";
import { useAgents } from "@/hooks/use-agents";
import { slugifyId } from "@/lib/utils/slugify";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AgentsPage() {
  const { agents, loading } = useAgents();
  const [form, setForm] = useState({
    id: "",
    name: "",
    active: "true",
  });
  const [saving, setSaving] = useState(false);

  const handleEdit = (id: string, name: string, active: boolean) => {
    setForm({
      id,
      name,
      active: active ? "true" : "false",
    });
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      active: "true",
    });
  };

  const handleSubmit = async () => {
    if (!form.name) {
      return;
    }

    setSaving(true);
    try {
      await saveAgent({
        id: form.id || slugifyId(form.name),
        name: form.name,
        active: form.active === "true",
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipe"
        title="Agentes"
        description="Cadastre novos agentes, ajuste nomes e controle quem segue ativo para futuras escalas."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
                {form.id ? "Editar agente" : "Novo agente"}
              </h2>
              <p className="text-sm text-slate-500">Mantenha a base de agentes sempre organizada.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Maia"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select
              value={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.value }))}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : form.id ? "Salvar agente" : "Adicionar agente"}
            </Button>
            {form.id ? (
              <Button variant="secondary" onClick={resetForm}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
              Lista de agentes
            </h2>
            <p className="mt-1 text-sm text-slate-500">Os agentes inativos não aparecem no cadastro de escala.</p>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando agentes...</p>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{agent.name}</p>
                    <p className="text-sm text-slate-500">
                      {agent.active ? "Disponível para novas escalas" : "Marcado como inativo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(agent.id, agent.name, agent.active)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={agent.active ? "danger" : "primary"}
                      onClick={() =>
                        saveAgent({
                          id: agent.id,
                          name: agent.name,
                          active: !agent.active,
                        })
                      }
                    >
                      {agent.active ? "Inativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
