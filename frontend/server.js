const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = 3000;
const mime = { ".html":"text/html", ".css":"text/css", ".js":"application/javascript" };

// ponytail: if :3000 is held by an old `node server.js`, reuse it instead of crashing.
// We bind, and on EADDRINUSE we fall through to the existing listener (which is already
// serving — likely the same files from this directory anyway).
const server = http.createServer((req, res) => {
  let url = req.url === "/" ? "/index.html" : req.url;
  const p = path.join(root, url);
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, {"Content-Type": mime[path.extname(p)] || "text/plain"});
    res.end(data);
  });
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.warn(`frontend: port ${port} busy — assumed already serving this dir.`);
    console.warn(`          if you need a fresh start: kill the old node server.js first.`);
    process.exit(0);
  }
  throw e;
});

server.listen(port, () => console.log(`frontend → http://localhost:${port}`));
