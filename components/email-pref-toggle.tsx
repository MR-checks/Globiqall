"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setEmailNotifications } from "@/app/actions/notifications";

export function EmailPrefToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function toggle(next: boolean) {
    setOn(next);
    setPending(true);
    const res = await setEmailNotifications(next);
    setPending(false);
    if (!res.ok) {
      setOn(!next);
      toast.error("Couldn't update preference");
    } else {
      toast.success(next ? "Email notifications on" : "Email notifications off");
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-[14px] font-medium tracking-tight-2">Email notifications</div>
        <div className="text-[12px] text-muted-foreground">
          Get an email when your predictions resolve. Never marketing.
        </div>
      </div>
      <Switch checked={on} onCheckedChange={toggle} disabled={pending} aria-label="Email notifications" />
    </div>
  );
}
