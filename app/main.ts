import * as net from "net";
import { readFileSync, writeFileSync } from "fs"
import { gzipSync } from "zlib";
import HttpResponseBuilder from "./utils/responseBuilder";
import RequestReader from "./utils/requestReader";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const requestReader = new RequestReader(data)
        const httpResponseBuilder = new HttpResponseBuilder();
        const [method, path, term] = requestReader.readReq(data)
        const headers = requestReader.readHeaders(data)
        
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
            if (encodingsObj) {
                const encodings = encodingsObj.split(', ')
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
                    .setHeaders({'Content-Type': 'text/plain', 'Content-Length': `${term.length}`})
                    .setBody(Buffer.from(term))
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
                const body = requestReader.readBody(data)
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
