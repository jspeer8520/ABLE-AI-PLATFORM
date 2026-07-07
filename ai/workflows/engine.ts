import {
Workflow,
WorkflowContext
} from "./types";


export async function executeWorkflow(

workflow:Workflow,

context:WorkflowContext

){

for(const step of workflow.steps){

try{

await step.execute(context);

}

catch(error){

console.error(
`Workflow failed: ${step.name}`,
error
);

throw error;

}

}

return {

success:true,

workflow:workflow.id

};

}
