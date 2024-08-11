import path from "path";


export const staticPath = path.join("./static");
export const port = 17705;

export const api = {
    get: `/${"get"}`,
    upload: `/${"upload"}/*`,
    delete: `/${"delete"}/*`,
    query: `/${"query"}`
}

export default { staticPath, port, api }