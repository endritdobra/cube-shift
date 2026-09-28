import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const rootDir = process.cwd();
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolvePath(urlPath) {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = normalize(requestedPath).replace(/^(\.\.[\\/])+/, "");
  return join(rootDir, safePath);
}

createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
  const filePath = resolvePath(requestUrl.pathname);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = extname(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Cube Shift available at http://localhost:${port}`);
});
