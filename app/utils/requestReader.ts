import { Headers } from "../types/headers";

export default class RequestReader {
    data: Buffer;

    constructor(data: Buffer) {
        this.data = data
    }

    readReq = (data: Buffer) => {
        let req = data.toString()
        const lines = req.split('\r\n')
        const [method, path] = lines[0].split(' ')
        const term = path.split('/')[2]
        return [method, path, term]
    }
    
    readHeaders = (data: Buffer) => {
        let req = data.toString()
        const lines = req.split('\r\n')
        const headers = lines.slice(1, lines.length - 1)
        const headersObj: Headers = {}
    
        for (const headerStr of headers) {
            const [header, value] = headerStr.split(': ')
            headersObj[header] = value
        }
    
        return headersObj
    }
    
    readBody = (data: Buffer) => {
        let req = data.toString()
        const lines = req.split('\r\n')
        const body = lines[lines.length - 1]
        return body
    }
}

