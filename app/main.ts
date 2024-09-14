import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.setEncoding('utf-8')

    const req = socket.read()
    console.log(req)

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");
