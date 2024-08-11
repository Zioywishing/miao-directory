import path from "path";


export const staticPath = path.join("./static");
export const port = 17705;

export const api_get = `/${"get"}`;
export const api_upload = `/${"upload"}/*`;

export default { staticPath, port, api_get, api_upload }