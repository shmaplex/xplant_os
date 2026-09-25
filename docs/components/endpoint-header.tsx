import { KeyRound, RotateCcw, Cpu } from "lucide-react";
import { apiOrigin } from "@/lib/shared";
import { cn } from "@/lib/cn";

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  scopes: string[];
  deviceToken: boolean;
  idempotent: boolean;
};

const methodClass: Record<Endpoint["method"], string> = {
  GET: "bg-method-get",
  POST: "bg-method-post",
  PUT: "bg-method-patch",
  PATCH: "bg-method-patch",
  DELETE: "bg-method-delete",
};

export function MethodBadge({ method, className }: { method: Endpoint["method"]; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-method-fg",
        methodClass[method],
        className,
      )}
    >
      {method}
    </span>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-card px-2.5 py-1 text-xs text-fd-muted-foreground [&_svg]:size-3.5">
      {icon}
      {children}
    </span>
  );
}

/** Method, full URL, scope and credential facts for an API reference page. */
export function EndpointHeader({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-3 py-2.5">
        <MethodBadge method={endpoint.method} />
        <code className="min-w-0 font-mono text-sm text-fd-foreground">
          <span className="hidden text-fd-muted-foreground sm:inline">{apiOrigin}</span>
          {/* Break long paths only after a slash. */}
          {endpoint.path.split("/").map((segment, i) => (
            <span key={i}>
              {i > 0 ? (
                <>
                  /<wbr />
                </>
              ) : null}
              {segment}
            </span>
          ))}
        </code>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip icon={<KeyRound aria-hidden />}>
          {endpoint.scopes.length > 0 ? (
            <>
              Scope{" "}
              {endpoint.scopes.map((scope) => (
                <code key={scope} className="font-mono text-fd-foreground">
                  {scope}
                </code>
              ))}
            </>
          ) : (
            "No scope needed"
          )}
        </Chip>
        {endpoint.deviceToken ? (
          <Chip icon={<Cpu aria-hidden />}>Accepts a device token</Chip>
        ) : null}
        {endpoint.idempotent ? (
          <Chip icon={<RotateCcw aria-hidden />}>Honours Idempotency-Key</Chip>
        ) : null}
      </div>
    </div>
  );
}
