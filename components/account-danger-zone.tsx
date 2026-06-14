"use client";

import * as React from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteMyAccount } from "@/app/actions/account";

export function AccountDangerZone({ username }: { username: string | null }) {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const expected = (username ?? "DELETE").toLowerCase();
  const matches = confirm.trim().toLowerCase() === expected;

  async function handleDelete(formData: FormData) {
    formData.set("confirm", confirm);
    setPending(true);
    const res = await deleteMyAccount(formData);
    setPending(false);
    if (res && !res.ok) {
      toast.error(res.error);
      return;
    }
    // Server action redirects on success; flow ends here.
  }

  return (
    <section className="mt-8 rounded-md border border-destructive/40 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-destructive mb-2">
        <TriangleAlert className="h-3 w-3" />
        Danger zone
      </div>
      <h2 className="text-[18px] font-medium tracking-tight-2">Delete your account</h2>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-prose">
        Permanent. Wipes your profile, your polls (and every vote + comment on
        them), and your own votes + comments. Aggregate vote counts on other
        people's polls drop accordingly. No way to undo this.
      </p>

      {!open ? (
        <div className="mt-4">
          <Button variant="outline" onClick={() => setOpen(true)}>
            I want to delete my account
          </Button>
        </div>
      ) : (
        <form action={handleDelete} className="mt-4 space-y-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Type{" "}
              <span className="text-foreground">
                {username ? `@${username}` : "DELETE"}
              </span>{" "}
              to confirm
            </span>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={username ?? "DELETE"}
              className="mt-1.5 bg-card h-10"
              autoFocus
            />
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !matches}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              Delete account permanently
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
