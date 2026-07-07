import {
Workflow
} from "../types";


const onboarding:Workflow={

id:"user-onboarding",

name:"ABLE User Onboarding",

steps:[

{

name:"create-profile",

async execute(){

console.log(
"Creating user profile"
);

}

},

{

name:"initialize-ai",

async execute(){

console.log(
"Initializing AI workspace"
);

}

}

]

};


export default onboarding;
