export async function runAIAction(

prompt:string,

input:unknown

){

return {

prompt,

input,

status:"queued"

};

}
