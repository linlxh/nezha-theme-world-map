const domain = "http://217.142.235.109:8008";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleRequest(request);
    } else if (url.pathname.startsWith("/ws")) {
      return handleWebSocket(request);
    }

    return env.ASSETS.fetch(request);
  },
};

const handleRequest = async (request) => {
  const url = new URL(request.url);
  url.host = domain;

  const modifiedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: request.method,
    body: request.body,
    redirect: "follow",
  });
  const response = await fetch(modifiedRequest);

  return new Response(response.body, response);
};

const handleWebSocket = async (request) => {
  const upgradeHeader = request.headers.get("Upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const webSocket = new WebSocket(`wss://${domain}/ws`);
  webSocket.addEventListener("message", (event) => {
    server.send(event.data);
  });

  const [client, server] = Object.values(new WebSocketPair());
  server.accept();
  server.addEventListener("message", (event) => {
    webSocket.send(event.data);
  });

  return new Response(null, { status: 101, webSocket: client });
};
