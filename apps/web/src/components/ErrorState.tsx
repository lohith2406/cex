import { ReactNode } from "react";
import { Button } from "./ui/button";

export function ErrorState({ children, onRetry }: { children: ReactNode, onRetry: () => void }) {
    return (
        <div role="alert" className="flex flex-col items-center gap-3 p-3 text-sm text-down">
            {children}
            <Button variant="outline" size="sm" onClick={() => onRetry()}>
                Try again
            </Button>
        </div>
    );
}