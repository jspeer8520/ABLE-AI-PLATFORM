export async function sendEmail(

to:string,

subject:string,

body:string

){

return {

to,

subject,

body,

sent:true

};

}
