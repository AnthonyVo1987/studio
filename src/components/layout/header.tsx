'use client';

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
  appVersion: string;
  lastUpdatedTimestamp?: string; // Optional for now
}

export function Header({ appVersion }: HeaderProps) {
  const { setTheme } = useTheme();
  const {
    fsmState: globalFsmState,
    previousFsmState: globalPreviousFsmState,
    targetFsmDisplayState: globalTargetFsmDisplayState
  } = useStockAnalysis();

  return (
    <header className="py-4 px-6 border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          <h1 className="text-2xl font-headline font-semibold">StockSage <span className="text-lg font-normal text-muted-foreground">{appVersion}</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground text-right space-x-1 hidden md:block">
              <span>Prev: <span className={cn("font-semibold", globalPreviousFsmState ? "text-foreground/80" : "")}>{globalPreviousFsmState || 'N/A'}</span></span>
              <span>|</span>
              <span>Curr: <span className="font-semibold text-primary">{globalFsmState}</span></span>
              <span>|</span>
              <span>Target: <span className={cn("font-semibold", globalTargetFsmDisplayState ? "text-foreground/80" : "")}>{globalTargetFsmDisplayState || 'N/A'}</span></span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
