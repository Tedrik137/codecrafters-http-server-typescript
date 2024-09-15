import { Headers } from "../types/headers";

export default class HttpResponseBuilder {
    version: string;
    status: string;
    headers: string;
    body: Buffer;

    constructor() {
        this.version = 'HTTP/1.1';
        this.status = ''
        this.body = Buffer.from('');
        this.headers = ''
    }

    buildResponse() {
        return `${this.version} ${this.status}\r\n${this.headers}\r\n${this.body}`
    }

    setVersion(version: string) {
        this.version = version
        return this
    }

    setStatus(status: string) {
        this.status = status
        return this
    }

    setHeaders(headers: Headers) {
        for (const header in headers) {
            this.headers += `${header}: ${headers[header]}\r\n`
        }
        return this
    }

    setBody(body: Buffer) {
        this.body = body
        return this
    }
}
