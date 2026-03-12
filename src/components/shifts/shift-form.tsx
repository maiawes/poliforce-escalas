"use client";

import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createEmptyBlock, calculateShift, getDefaultTimesForDate, getShiftMode } from "@/lib/shifts/calculations";
import { saveShift } from "@/lib/firebase/firestore";
import { ShiftDraft, ShiftWithBlocks } from "@/types";
import { useAgents } from "@/hooks/use-agents";
import { useSettings } from "@/hooks/use-settings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShiftPreview } from "./shift-preview";
import { getDayTypeLabel } from "@/lib/shifts/formatters";

type ShiftFormProps = {
  title: string;
  description: string;
  existingShift?: ShiftWithBlocks | null;
};

function getInitialDraft(existingShift?: ShiftWithBlocks | null): ShiftDraft {
  if (existingShift) {
    return {
      date: existingShift.date,
      notes: existingShift.notes,
      blocks: existingShift.blocks.map((block) => ({
        agentId: block.agentId,
        agentName: block.agentName,
        startTime: block.startTime,
        endTime: block.endTime,
      })),
    };
  }

  const today = new Date();
  const date = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;

  return {
    date,
    notes: "",
    blocks: [createEmptyBlock()],
  };
}

export function ShiftForm({ title, description, existingShift }: ShiftFormProps) {
  const router = useRouter();
  const { activeAgents, loading: loadingAgents } = useAgents();
  const { settings, loading: loadingSettings } = useSettings();
  const [draft, setDraft] = useState<ShiftDraft>(() => getInitialDraft(existingShift));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingShift) {
      setDraft(getInitialDraft(existingShift));
      return;
    }

    const defaultTimes = getDefaultTimesForDate(draft.date, settings);
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block, index) =>
        index === 0 && !block.startTime && !block.endTime
          ? {
              ...block,
              startTime: defaultTimes.startTime,
              endTime: defaultTimes.endTime,
            }
          : block,
      ),
    }));
  }, [draft.date, existingShift, settings]);

  const hasCompleteBlocks = draft.blocks.every((block) => block.startTime && block.endTime);
  const calculation = draft.date && hasCompleteBlocks ? calculateShift(draft, settings) : null;
  const mode = getShiftMode(draft.blocks.length);

  const setBlock = (
    index: number,
    field: "agentId" | "agentName" | "startTime" | "endTime",
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) => {
        if (blockIndex !== index) {
          return block;
        }

        if (field === "agentId") {
          const agent = activeAgents.find((item) => item.id === value);
          return {
            ...block,
            agentId: value,
            agentName: agent?.name ?? "",
          };
        }

        return {
          ...block,
          [field]: value,
        };
      }),
    }));
  };

  const addBlock = () => {
    setDraft((current) => ({
      ...current,
      blocks: [...current.blocks, createEmptyBlock()],
    }));
  };

  const removeBlock = (index: number) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const changeMode = (nextMode: "simple" | "split") => {
    if (nextMode === "simple") {
      setDraft((current) => ({
        ...current,
        blocks: [current.blocks[0] ?? createEmptyBlock()],
      }));
      return;
    }

    if (draft.blocks.length === 1) {
      addBlock();
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      await saveShift(draft, settings, existingShift?.id);
      router.push("/escalas");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Não foi possível salvar a escala.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAgents || loadingSettings) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Carregando formulário...</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Data da escala</label>
            <Input
              type="date"
              value={draft.date}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo identificado</label>
            <div className="flex h-[50px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Badge className="bg-sky-100 text-sky-800">
                {calculation ? getDayTypeLabel(calculation.dayType) : "Selecione uma data"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Observações</label>
          <Textarea
            placeholder="Informações extras da escala, observações operacionais ou repasses específicos."
            value={draft.notes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={mode === "simple" ? "primary" : "secondary"}
              onClick={() => changeMode("simple")}
            >
              Escala simples
            </Button>
            <Button
              type="button"
              variant={mode === "split" ? "primary" : "secondary"}
              onClick={() => changeMode("split")}
            >
              Escala dividida
            </Button>
          </div>

          <div className="space-y-4">
            {draft.blocks.map((block, index) => (
              <div key={index} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Bloco {index + 1}</p>
                  {draft.blocks.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-rose-600"
                    >
                      <Trash2 size={16} />
                      Remover
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Agente</label>
                    <Select
                      value={block.agentId}
                      onChange={(event) => setBlock(index, "agentId", event.target.value)}
                    >
                      <option value="">Selecione o agente</option>
                      {activeAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hora inicial</label>
                    <Input
                      type="time"
                      value={block.startTime}
                      onChange={(event) => setBlock(index, "startTime", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Hora final</label>
                    <Input
                      type="time"
                      value={block.endTime}
                      onChange={(event) => setBlock(index, "endTime", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={addBlock}>
            <Plus size={16} />
            Adicionar bloco
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            <Save size={16} />
            {saving ? "Salvando..." : existingShift ? "Salvar alterações" : "Cadastrar escala"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </Card>

      <div className="space-y-6">
        <ShiftPreview calculation={calculation} />
      </div>
    </div>
  );
}
