const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const WebSocket = require("ws");
const fs = require("fs");
const serveStatic = require("serve-static");
const bodyParser = require("body-parser");

// Servir los archivos estáticos en la carpeta `public`
app.use(serveStatic("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static(__dirname + "/public"));
app.use("/data.json", express.static(__dirname + "/public/data.json"));

const dataFilePath = __dirname + "/public/data.json";

app.post("/submit-form", (req, res) => {
  const data = req.body.message;
  console.log("Datos recibidos en /submit-form", data);
  const jsonData = JSON.stringify(data);

  // Crear el archivo si no existe
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, "");
  }

  // Agregar la nueva entrada al archivo
  fs.appendFile(dataFilePath, jsonData + "\n", (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error al guardar los datos");
      return;
    }

    // Enviar mensaje a través del WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log("Mensaje enviado por WebSocket", jsonData);
        client.send(jsonData);
      }
    });

    res.send(`
      <html>
        <link rel="stylesheet" href="style.css">
        <head>
          <title>Datos guardados</title>
        </head>
        <body>
          <h1>Datos guardados correctamente</h1>
          <p><a href="/">Volver a la página principal</a></p>
        </body>
      </html>
    `);
  });
});

const wss = new WebSocket.Server({ server });
wss.setMaxListeners(1); // Limitar numero de conexiones WebSocket

wss.on("connection", (ws) => {
  console.log("Cliente conectado a WebSocket");

  ws.on("message", (message) => {
    console.log(`Mensaje recibido d WebSocket: ${message}`);
  });

  ws.on("close", () => {
    console.log("Cliente WebSocket desconectado");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(
    `Servidor accesible en la red local en http://${getLocalIpAddress()}:${PORT}`
  );
  console.log(`WebSocket escuchando en ws://${getLocalIpAddress()}:${PORT}`);
});

function getLocalIpAddress() {
  const interfaces = require("os").networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }
  return "localhost";
}
