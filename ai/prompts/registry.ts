export const PROMPTS = {

CORE:
"prompts/system/able-core.md",

SECURITY:
"prompts/system/security-agent.md",

BILLING:
"prompts/system/billing-agent.md",

CREATOR:
"prompts/agents/creator-agent.md",

MARKETING:
"prompts/agents/marketing-agent.md"

} as const;


export type PromptName =
keyof typeof PROMPTS;
