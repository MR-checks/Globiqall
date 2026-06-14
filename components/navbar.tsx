import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "G").toUpperCase();
  const hasUsername = Boolean((user as { username?: string } | undefined)?.username);
  const username = (user as { username?: string } | undefined)?.username;

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md hairline-b">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center">
            <BrandLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-[13px]">
            <NavLink href="/">Trending</NavLink>
            <NavLink href="/daily">Daily</NavLink>
            <NavLink href="/predictions">Predict</NavLink>
            <NavLink href="/arenas">Arenas</NavLink>
            <NavLink href="/leagues">Leagues</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/explore"
            aria-label="Search"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Search className="h-4 w-4" />
          </Link>

          <ThemeToggle />

          <span className="mx-1 hidden sm:block h-5 w-px bg-border" aria-hidden />

          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <Button asChild size="sm" variant="accent" className="hidden sm:inline-flex">
                <Link href="/new">
                  <Plus /> New poll
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ml-1">
                  <Avatar className="h-8 w-8 border border-border">
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="px-2 py-2 normal-case tracking-normal">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.name ?? user.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasUsername && username && (
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${username}`}>My profile</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/my-polls">My polls</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/new">New poll</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      {hasUsername ? "Profile settings" : "Set up profile"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/account">Account & data</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full text-left">
                        Sign out
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="accent">
                <Link href="/sign-in">Join</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-foreground/70 hover:text-foreground transition-colors tracking-tight-2"
    >
      {children}
    </Link>
  );
}
