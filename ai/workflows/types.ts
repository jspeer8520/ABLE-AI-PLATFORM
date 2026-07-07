export type WorkflowStatus =
"pending" |
"running" |
"completed" |
"failed";


export interface WorkflowContext {

userId:string;

input:unknown;

metadata?:Record<string,unknown>;

}


export interface WorkflowStep {

name:string;

execute(
context:WorkflowContext
):Promise<void>;

}


export interface Workflow {

id:string;

name:string;

steps:WorkflowStep[];

}
