// Runs before `preview`. Wrangler's local runtime (workerd.exe) needs the Microsoft Visual C++ 2015-2022 x64
// runtime. When Windows does not have it installed system-wide (installing it requires administrator rights),
// this copies the same Microsoft-signed DLLs that Microsoft Edge ships next to workerd.exe, where Windows looks
// first. No-op on other systems, when the runtime is installed, or when the copy is already in place.
import { copyFileSync, existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const DLLS = ["msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll"];
const X64 = 0x8664;

if (process.platform !== "win32") process.exit(0);
const system32 = join(process.env.SystemRoot ?? "C:\\Windows", "System32");
if (DLLS.every((name) => existsSync(join(system32, name)))) process.exit(0);

const require = createRequire(import.meta.url);
let bin;
try {
  bin = join(
    dirname(realpathSync(require.resolve("@cloudflare/workerd-windows-64/package.json"))),
    "bin",
  );
} catch {
  console.error("workerd não está instalado; rode a instalação das dependências primeiro.");
  process.exit(1);
}
if (DLLS.every((name) => existsSync(join(bin, name)))) process.exit(0);

/** True when the file is a 64-bit (x64) Windows binary. */
function isX64(file) {
  const bytes = readFileSync(file);
  const pe = bytes.readUInt32LE(0x3c);
  return bytes.readUInt16LE(pe + 4) === X64;
}

/** Edge (and its WebView) install the runtime app-locally in each versioned folder; newest first. */
function edgeFolders() {
  const roots = [process.env["ProgramFiles(x86)"], process.env.ProgramFiles].filter(Boolean);
  const folders = [];
  for (const root of roots)
    for (const product of ["EdgeWebView", "Edge", "EdgeCore"]) {
      const base = join(root, "Microsoft", product, product === "EdgeCore" ? "" : "Application");
      if (!existsSync(base)) continue;
      for (const entry of readdirSync(base, { withFileTypes: true }))
        if (entry.isDirectory() && /^\d+(\.\d+)+$/.test(entry.name))
          folders.push(join(base, entry.name));
    }
  const version = (folder) => folder.split(/[\\/]/).pop().split(".").map(Number);
  return folders.sort((a, b) => {
    const [x, y] = [version(a), version(b)];
    for (let i = 0; i < Math.max(x.length, y.length); i++)
      if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0);
    return 0;
  });
}

const source = edgeFolders().find((folder) =>
  DLLS.every((name) => existsSync(join(folder, name)) && isX64(join(folder, name))),
);
if (!source) {
  console.error(
    "Falta o Microsoft Visual C++ 2015-2022 x64, necessário para abrir o site localmente.\n" +
      "Instale como administrador: https://aka.ms/vs/17/release/vc_redist.x64.exe",
  );
  process.exit(1);
}
for (const name of DLLS) copyFileSync(join(source, name), join(bin, name));
console.log(`Runtime Visual C++ copiado de ${source} para o workerd (sem instalação no sistema).`);
