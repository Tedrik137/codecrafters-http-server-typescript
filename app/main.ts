import * as net from "net";
import { readFileSync, writeFileSync } from "fs"
import { gzipSync } from "zlib";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

type Headers = {[key: string]: string}

const readReq = (data: Buffer) => {
    let req = data.toString()
    const lines = req.split('\r\n')
    const [method, path] = lines[0].split(' ')
    const term = path.split('/')[2]
    return [method, path, term]
}

const readHeaders = (data: Buffer) => {
    let req = data.toString()
    const lines = req.split('\r\n')
    const headers = lines.slice(1, lines.length - 1)
    const headersObj: Headers = {}

    for (const headerStr in headers) {
        const [header, value] = headerStr.split(': ')
        headersObj[header] = value
    }

    return headersObj
}

const readBody = (data: Buffer) => {
    let req = data.toString()
    const lines = req.split('\r\n')
    const body = lines[lines.length - 1]
    return body
}

class HttpResponseBuilder {
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

const httpResponseBuilder = new HttpResponseBuilder();

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const [method, path, term] = readReq(data)
        const headers = readHeaders(data)
        console.log(method, path, term)
        console.log(headers)
        
        if (path === '/') {
            const response = httpResponseBuilder.setStatus('200 OK').buildResponse()
            socket.write(response)
        }
        else if (path === '/user-agent') {
            const userAgent = headers['User-Agent']
            const response = httpResponseBuilder.setStatus('200 OK')
            .setHeaders({'Content-Type': 'text/plain', 'Content-Length': `${userAgent.length}`})
            .setBody(Buffer.from(userAgent))
            .buildResponse()
            socket.write(response)
        }
        else if (path === `/echo/${term}`) {
            const encodingsObj = headers['Accept-Encoding']
            console.log(encodingsObj)
            if (encodingsObj) {
                const encodings = encodingsObj.split(', ')
                console.log(encodings)
                if (encodings.includes('gzip')) {
                    const compressed = gzipSync(term)
                    
                    const httpResponse = httpResponseBuilder.setStatus('200 OK')
                    .setHeaders({'Content-Type': 'text/plain', 'Content-Encoding': 'gzip', 'Content-Length': `${compressed.length}`})
                    .buildResponse()

                    socket.write(httpResponse);
                    socket.write(compressed);                
                }
                else {
                    const httpResponse = httpResponseBuilder.setStatus('200 OK')
                    .setHeaders({'Content-Type': 'text/plain'})
                    .buildResponse()
                    socket.write(httpResponse)
                }
            }
            else {
                const httpResponse = httpResponseBuilder.setStatus('200 OK')
                    .setHeaders({'Content-Type': 'text/plain', 'Content-Length': `${term.length}`})
                    .setBody(Buffer.from(term))
                    .buildResponse()
                socket.write(httpResponse) 
            }
            
        }
        else if (path === `/files/${term}`) {
            const filePath = process.argv[3]
            const absFilePath = filePath + term

            if (method === 'GET') {
                try {
                    const buffer = readFileSync(absFilePath);
                    const httpResponse = httpResponseBuilder.setStatus('200 OK')
                    .setHeaders({'Content-Type': 'application/octet-stream', 'Content-Length': `${buffer.length}`})
                    .setBody(buffer)
                    .buildResponse()
                    socket.write(httpResponse)
                    
                }
                catch (e) {
                    const httpResponse = httpResponseBuilder.setStatus('404 Not Found')
                    .buildResponse()
                    socket.write(httpResponse)
                }
            }
            else if (method === 'POST') {
                const body = readBody(data)
                try {
                    writeFileSync(absFilePath, body)
                    const httpResponse = httpResponseBuilder.setStatus('201 Created')
                    .buildResponse()
                    socket.write(httpResponse)
                }
                catch (e) {
                    const httpResponse = httpResponseBuilder.setStatus('500 Internal Server Error')
                    .buildResponse()
                    socket.write(httpResponse)
                }
            }
        }
        else {
            const httpResponse = httpResponseBuilder.setStatus('404 Not Found')
            .buildResponse()
            socket.write(httpResponse)
        }
    })


    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
