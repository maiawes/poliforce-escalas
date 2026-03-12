import { ReactNode } from "react";
import { Card } from "./card";

type DataStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function DataState({ title, description, action }: DataStateProps) {
  return (
    <Card className="flex min-h-52 flex-col items-center justify-center gap-3 border-dashed text-center">
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-900">
        {title}
      </h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </Card>
  );
}
