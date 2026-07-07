import { type Request, type Response } from 'express';

import { getAgentStatus, runAgent } from '../../services/agents/agents.service';
import { agentIdSchema, runAgentSchema } from '../validators/agents.validators';

export async function runAgentHandler(req: Request, res: Response): Promise<void> {
  const { agent, task } = runAgentSchema.parse(req.body);
  const execution = await runAgent(agent, task);
  res.status(202).json({ executionId: execution.executionId, status: execution.status });
}

export async function getAgentStatusHandler(req: Request, res: Response): Promise<void> {
  const executionId = agentIdSchema.parse(req.params.id);
  const execution = await getAgentStatus(executionId);
  res.json({
    executionId: execution.executionId,
    agent: execution.agent,
    task: execution.task,
    status: execution.status,
    logs: execution.logs,
    result: execution.result,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  });
}
