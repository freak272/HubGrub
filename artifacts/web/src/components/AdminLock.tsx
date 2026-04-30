import { useState } from "react";
import { Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import { useToast } from "@/hooks/use-toast";

interface AdminLockProps {
  children: React.ReactNode;
}

export function AdminLock({ children }: AdminLockProps) {
  const { isUnlocked, unlock } = useAdminKey();
  const [input, setInput] = useState("");
  const { toast } = useToast();

  if (isUnlocked) return <>{children}</>;

  const handleUnlock = () => {
    if (!input.trim()) return;
    unlock(input.trim());
    toast({ title: "Admin access granted" });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Admin Access Required</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your admin key to view this page.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Admin key"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className="flex-1"
          />
          <Button onClick={handleUnlock} disabled={!input.trim()} className="gap-2">
            <KeyRound size={16} />
            Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}
