import React from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StateView } from "@/components/ui/state-view";

export function CopilotPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Intelligence Copilot"
        subtitle="Bilingual (Kannada & English) conversational investigative assistant with strict relational and vector grounding."
      />
      <StateView
        icon={<Sparkles className="h-6 w-6 text-primary animate-pulse" />}
        title="Ambient Copilot Engine Armed"
        description="Streamed LLM inference via Groq, contextual screen injection, and audio synthesis will be wired in Stage 4."
      />
    </div>
  );
}
