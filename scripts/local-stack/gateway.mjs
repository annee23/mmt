// Tiny stand-in for Supabase's Kong gateway so supabase-js can talk to a local
// PostgREST (/rest/v1) and GoTrue (/auth/v1) without Docker.
import http from "node:http";

const routes = [
  ["/rest/v1", 54331],
  ["/auth/v1", 54332],
];

http
  .createServer((req, res) => {
    const route = routes.find(([prefix]) => req.url.startsWith(prefix));
    if (!route) {
      res.writeHead(404).end("not found");
      return;
    }
    const [prefix, port] = route;
    const proxied = http.request(
      { host: "127.0.0.1", port, path: req.url.slice(prefix.length) || "/", method: req.method, headers: req.headers },
      (upstream) => {
        res.writeHead(upstream.statusCode ?? 502, upstream.headers);
        upstream.pipe(res);
      },
    );
    proxied.on("error", () => res.writeHead(502).end("bad gateway"));
    req.pipe(proxied);
  })
  .listen(54321, "127.0.0.1", () => console.log("gateway on :54321"));
