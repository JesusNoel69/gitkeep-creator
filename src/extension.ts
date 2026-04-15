import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "gitkeep-creator.managefiles",
    async () => {
      const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        defaultUri: vscode.workspace.workspaceFolders?.[0].uri,
        canSelectMany: false,
        openLabel: "Select .gitignore",
      });
    },
  );

  const provider = new PanelProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("gitkeepPanel", provider),
  );
  context.subscriptions.push(disposable);
}

class PanelProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
    };
    let currentPath = "";
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "selectFolder") {
        const result = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
        });

        if (result && result.length > 0) {
          currentPath = result[0].fsPath;

          webviewView.webview.postMessage({
            command: "setFolder",
            path: currentPath,
          });
        }
      }

      if (message.command === "addFiles") {
        if (!currentPath) {
          vscode.window.showWarningMessage("Select a folder first");
          return;
        }

        const gitignorePath = path.join(currentPath, ".gitignore");

        let ignore: string[] = [];

        if (fs.existsSync(gitignorePath)) {
          const uri = vscode.Uri.file(gitignorePath);
          ignore = await this.gitignoreFolders(uri);
        }

        await this.addFiles(ignore, vscode.Uri.file(currentPath));

        const tree = await this.buildTree(vscode.Uri.file(currentPath));

        webviewView.webview.postMessage({
          command: "renderTree",
          tree,
        });
      }
    });

    webviewView.webview.html = this.htmlTemplate();
  }
  async buildTree(root: vscode.Uri, prefix = ""): Promise<string> {
    const entries = await vscode.workspace.fs.readDirectory(root);
    let result = "";

    for (const [name, type] of entries) {
      result += `${prefix}${name}\n`;

      if (type === vscode.FileType.Directory) {
        const child = await this.buildTree(
          vscode.Uri.joinPath(root, name),
          prefix + "  ",
        );
        result += child;
      }
    }

    return result;
  }
  async addFiles(
    gitIgnoreFiles: string[],
    rootPath: vscode.Uri,
  ): Promise<void> {
    const entries = await vscode.workspace.fs.readDirectory(rootPath);

    for (const [name, type] of entries) {
      const cleanIgnore = gitIgnoreFiles.map((f) => f.replace("/", ""));

      if (type !== vscode.FileType.Directory) {
        continue;
      }

      if (cleanIgnore.includes(name)) {
        continue;
      }
      if (gitIgnoreFiles.includes(name)) {
        continue;
      }

      const folderUri = vscode.Uri.joinPath(rootPath, name);

      const subEntries = await vscode.workspace.fs.readDirectory(folderUri);

      if (subEntries.length === 0) {
        const fileUri = vscode.Uri.joinPath(folderUri, ".gitkeep");

        await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
      } else {
        await this.addFiles(gitIgnoreFiles, folderUri);
      }
    }
  }

  async gitignoreFolders(fileUri: vscode.Uri): Promise<string[]> {
    let file: string[] = [];
    try {
      const fileData = await vscode.workspace.fs.readFile(fileUri);

      file = Buffer.from(fileData)
        .toString("utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));
    } catch (error: any) {
      vscode.window.showErrorMessage(`Cannot read file: ${error.message}`);
    }
    return file;
  }
  htmlTemplate(): string {
    return `
    <html
      style="
        width:100%;
        padding-right:1rem;
      "
    >
      <body>
        <div style="width:100%; 
          display:flex;
          justify-content: center;
          gap:5px;
        ">
          <button onclick="addFiles()" type="button" style="cursor: pointer; border-radius: 3px; color: white; background:#2b7da3; height: 2rem; width:100%;">Add</button>
          <button type="button" style="cursor: pointer; border-radius: 3px; background:red; width: 2rem; height: 2rem;">
            <svg
              viewBox="0 0 1024 1024"
              class="icon"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              fill="#ffffff"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M960 160h-291.2a160 160 0 0 0-313.6 0H64a32 32 0 0 0 0 64h896a32 32 0 0 0 0-64zM512 96a96 96 0 0 1 90.24 64h-180.48A96 96 0 0 1 512 96zM844.16 290.56a32 32 0 0 0-34.88 6.72A32 32 0 0 0 800 320a32 32 0 1 0 64 0 33.6 33.6 0 0 0-9.28-22.72 32 32 0 0 0-10.56-6.72zM832 416a32 32 0 0 0-32 32v96a32 32 0 0 0 64 0v-96a32 32 0 0 0-32-32zM832 640a32 32 0 0 0-32 32v224a32 32 0 0 1-32 32H256a32 32 0 0 1-32-32V320a32 32 0 0 0-64 0v576a96 96 0 0 0 96 96h512a96 96 0 0 0 96-96v-224a32 32 0 0 0-32-32z"
                  fill="#ffffff"
                ></path>
                <path
                  d="M384 768V352a32 32 0 0 0-64 0v416a32 32 0 0 0 64 0zM544 768V352a32 32 0 0 0-64 0v416a32 32 0 0 0 64 0zM704 768V352a32 32 0 0 0-64 0v416a32 32 0 0 0 64 0z"
                  fill="#ffffff"
                ></path>
              </g>
            </svg>
          </button>
        </div>
        <div style="width:100%; 
          display:flex;
          justify-content: center;
          gap:5px;
        ">
          <input
            id="pathInput"
            style="
              border-radius: 3px;
              max-height: 22px;
              width: calc(100% - 40px);
              border: solid 2.5px;
              padding: 0.5rem 1rem;
              border-radius: 0.2rem 0.3rem;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            "
          />
          <button onclick="selectFolder()" type="button" style="cursor: pointer; border-radius: 3px; width: 2rem; height: 2rem;">...</button>
        </div>

        <pre id="tree" style="
          border-radius: 3px;
          width: 100%; 
          height: 300px; 
          border: solid 1px red;
          background: white;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.4;
        "></pre>
      </body>
      <script>
        const vscode = acquireVsCodeApi();

        function selectFolder() {
          vscode.postMessage({ command: "selectFolder" });
        }

        function addFiles() {
          vscode.postMessage({ command: "addFiles" });
        }

        window.addEventListener("message", event => {
          const message = event.data;

          if (message.command === "setFolder") {
            document.getElementById("pathInput").value = message.path;
          }

          if (message.command === "renderTree") {
            document.getElementById("tree").textContent = message.tree;
          }
        });
      </script>
    </html>
  `;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
