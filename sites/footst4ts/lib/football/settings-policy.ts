export function canManage(user:{email:string}|null,owner:string){return !!user&&!!owner&&user.email.toLowerCase()===owner.toLowerCase()}
export function validWrite(origin:string|null,expected:string,type:string|null){return !!expected&&origin===expected&&!!type?.startsWith('application/json')}
