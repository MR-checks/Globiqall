"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportMyData } from "@/app/actions/account";

export function ExportDataButton() {
  const [pending, setPending] = React.useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const res = await exportMyData();
      if (!res.ok) {
        toast.error(res.error ?? "Export failed");
        return;
      }
      const blob = new Blob([JSON.stringify(res.payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `globiqall-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Download />}
      Export my data
    </Button>
  );
}
