import { randomUUID } from 'crypto';

import { NotFoundError } from '../../lib/errors';
import type { AgentType } from '../../api/validators/agents.validators';

export interface AgentExecution {
  executionId: string;
  agent: AgentType;
  task: string;
  status: 'running' | 'completed' | 'failed';
  logs: string[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}

const executions = new Map<string, AgentExecution>();

function createExecution(agent: AgentType, task: string): AgentExecution {
  const execution: AgentExecution = {
    executionId: randomUUID(),
    agent,
    task,
    status: 'running',
    logs: ['Execution queued', `Agent ${agent} started task.`],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  executions.set(execution.executionId, execution);

  setTimeout(() => {
    execution.status = 'completed';
    execution.logs.push('Agent execution completed successfully.');
    execution.result = `Agent ${agent} completed task: ${task}`;
    execution.updatedAt = new Date().toISOString();
  }, 1500);

  return execution;
}

export async function runAgent(agent: AgentType, task: string): Promise<AgentExecution> {
  return createExecution(agent, task);
}

export async function getAgentStatus(executionId: string): Promise<AgentExecution> {
  const execution = executions.get(executionId);
  if (!execution) {
    throw new NotFoundError(`Agent execution ${executionId} not found`);
  }
  return execution;
}
