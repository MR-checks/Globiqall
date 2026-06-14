import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, enabledProviders, signIn } from "@/auth";
import { BrandLogo } from "@/components/brand-logo";
import { SignInForm } from "@/components/sign-in-form";

type SearchParams = Promise<{ next?: string; error?: string }>;

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { next, error } = await searchParams;
  if (session?.user) redirect(next ?? "/");

  return (
    <div className="container max-w-sm py-14 sm:py-20">
      <div className="mb-8">
        <BrandLogo size={24} />
        <div className="mt-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Sign in
          </div>
          <h1 className="text-[26px] leading-tight font-medium tracking-tightest">
            Join the world's signal.
          </h1>
          <p className="text-muted-foreground mt-1 text-[14px]">
            One vote, one voice. Free, fair, live.
          </p>
        </div>
      </div>

      <SignInForm
        next={next ?? "/"}
        providers={enabledProviders}
        oauthSignIn={async (provider: string) => {
          "use server";
          await signIn(provider, { redirectTo: next ?? "/" });
        }}
        emailSignIn={async (formData: FormData) => {
          "use server";
          const email = String(formData.get("email") ?? "").trim();
          if (!email) return { ok: false as const, error: "Email is required" };
          try {
            await signIn("nodemailer", { email, redirectTo: next ?? "/" });
            return { ok: true as const };
          } catch (e) {
            if (
              e instanceof Error &&
              (e.message.includes("NEXT_REDIRECT") || e.message.includes("redirect"))
            ) {
              throw e;
            }
            return {
              ok: false as const,
              error: "Couldn't send link. Try a different provider.",
            };
          }
        }}
        quickLogin={
          enabledProviders.devQuick
            ? async (formData: FormData) => {
                "use server";
                const email = String(formData.get("email") ?? "").trim();
                const name = String(formData.get("name") ?? "").trim();
                if (!email) return { ok: false as const, error: "Email required" };
                await signIn("dev-quick", { email, name, redirectTo: next ?? "/" });
                return { ok: true as const };
              }
            : undefined
        }
        initialError={error}
      />

      <p className="text-center text-[11px] text-muted-foreground mt-8 font-mono uppercase tracking-[0.12em]">
        By continuing you agree to{" "}
        <Link href="/legal/terms" className="underline decoration-accent underline-offset-2 normal-case tracking-tight-2">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" className="underline decoration-accent underline-offset-2 normal-case tracking-tight-2">
          Privacy
        </Link>
      </p>
    </div>
  );
}
