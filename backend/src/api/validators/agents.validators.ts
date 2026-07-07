import { z } from 'zod';

export const supportedAgentTypes = [
  'security-agent',
  'coding-agent',
  'research-agent',
  'business-agent',
  'support-agent',
] as const;

export const runAgentSchema = z.object({
  agent: z.enum(supportedAgentTypes),
  task: z.string().min(1),
});

export const agentIdSchema = z.string().uuid();

export type AgentType = z.infer<typeof runAgentSchema>['agent'];
export type RunAgentInput = z.infer<typeof runAgentSchema>;
