import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        let req = data.toString()
        const path = req.split(' ')[1]
        const term = path.split('/')[2]
        
        if (path === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n')
        }
        else if (path === `/echo/${term}`) {
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${term.length}\r\n\r\n${term}`)
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
