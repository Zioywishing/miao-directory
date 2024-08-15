import path from "path";


export const staticPath = path.join("./static");
export const port = 17705;

export const api = {
    get: `/${"get"}`,
    query: `/${"query"}`,
    upload: `/${"upload"}/*`,
    delete: `/${"delete"}/*`,
    rename: `/${"rename"}/*`,
    cut: `/${"cut"}/*`,
}

export default { staticPath, port, api }