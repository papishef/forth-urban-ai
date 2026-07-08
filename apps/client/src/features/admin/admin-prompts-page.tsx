import * as React from "react";
import type { AdminPromptDTO } from "@forth-urban/shared-types";
import { Button, BuildingLoader, Card, CardContent, CardHeader, CardTitle } from "@forth-urban/ui";
import { useAdminPreviewPrompt, useAdminPrompts, useAdminUpdatePrompt } from "./admin-api";
import { AdminLayout } from "./admin-layout";

/** Editor for a single prompt. Keyed by `prompt.key` from the parent so switching the selected prompt
 *  remounts this component and re-initializes `body` fresh from props — no effect-driven sync needed. */
function PromptEditor({ prompt }: { prompt: AdminPromptDTO }) {
  const updatePrompt = useAdminUpdatePrompt();
  const previewPrompt = useAdminPreviewPrompt();
  const [body, setBody] = React.useState(prompt.body);
  const [previewContext, setPreviewContext] = React.useState("{}");

  return (
    <>
      <p className="text-xs text-[#181818]/50">Inputs: {prompt.inputs.join(", ") || "none"}</p>
      <textarea
        className="min-h-[220px] rounded-md border border-[#181818]/20 bg-white p-3 font-mono text-xs"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          disabled={updatePrompt.isPending}
          onClick={() => updatePrompt.mutate({ key: prompt.key, input: { body } })}
        >
          {updatePrompt.isPending ? "Saving…" : "Save (bumps version)"}
        </Button>
      </div>

      <div className="rounded-lg border border-[#181818]/10 p-3">
        <p className="mb-2 text-sm font-medium text-[#181818]">Preview</p>
        <textarea
          className="min-h-[80px] w-full rounded-md border border-[#181818]/20 bg-white p-2 font-mono text-xs"
          value={previewContext}
          onChange={(e) => setPreviewContext(e.target.value)}
          placeholder='{"buyerPersona": "Budget Starter"}'
        />
        <div className="mt-2 flex justify-end">
          <Button
            variant="secondary"
            disabled={previewPrompt.isPending}
            onClick={() => {
              try {
                const context = JSON.parse(previewContext) as Record<string, unknown>;
                previewPrompt.mutate({ key: prompt.key, input: { context } });
              } catch {
                // Invalid JSON — ignore, preview simply won't run.
              }
            }}
          >
            {previewPrompt.isPending ? "Generating…" : "Preview"}
          </Button>
        </div>
        {previewPrompt.data && (
          <div className="mt-3 rounded-md bg-[#FFECE4] p-3 text-sm">
            <p className="mb-1 text-xs text-[#181818]/50">
              provider: {previewPrompt.data.provider} · degraded: {String(previewPrompt.data.degraded)}
            </p>
            <p className="whitespace-pre-wrap text-[#181818]">{previewPrompt.data.text}</p>
          </div>
        )}
      </div>
    </>
  );
}

/** Versioned Markdown prompt editor + preview — AGENTS.md rule #1: prompts never hardcoded in code. */
export function AdminPromptsPage() {
  const { data, isLoading } = useAdminPrompts();
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const selected = data?.find((p) => p.key === selectedKey);

  return (
    <AdminLayout title="Prompts">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Prompt files</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isLoading && <BuildingLoader size="sm" label="Loading…" className="py-6" />}
            {data?.map((prompt) => (
              <button
                key={prompt.key}
                onClick={() => setSelectedKey(prompt.key)}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  selectedKey === prompt.key ? "border-[#5C4033] bg-white" : "border-[#181818]/10"
                }`}
              >
                <p className="font-medium text-[#181818]">{prompt.key}</p>
                <p className="text-xs text-[#181818]/50">v{prompt.version} · {prompt.modelHint}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selected ? `${selected.key} (v${selected.version})` : "Select a prompt"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selected && <PromptEditor key={selected.key} prompt={selected} />}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
