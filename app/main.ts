import * as net from "net";
import { readFileSync, writeFileSync } from "fs"

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let req = data.toString()
        const method = req.split(' ')[0]
        const path = req.split(' ')[1]
        const term = path.split('/')[2]
        
       
        if (path === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n')
        }
        else if (path === '/user-agent') {
            const headers = req.split('\r\n')[2]
            const userAgent = headers.split(': ')[1]
            
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`)
        }
        else if (path === `/echo/${term}`) {
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${term.length}\r\n\r\n${term}`)
        }
        else if (path === `/files/${term}`) {
            const filePath = process.argv[3]
            const absFilePath = filePath + term

            if (method === 'GET') {
                try {
                    const buffer = readFileSync(absFilePath);
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${buffer.length}\r\n\r\n${buffer}`)
                    
                }
                catch (e) {
                    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
                }
            }
            else if (method === 'POST') {
                const body = req.split('\r\n')[7]
                try {
                    writeFileSync(absFilePath, body)
                    socket.write('HTTP/1.1 201 Created\r\n\r\n')
                }
                catch (e) {
                    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
                }
            }

            
        }
        else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
        }
    })


    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
