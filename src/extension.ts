import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "gitkeep-creator.managefiles",
    async () => {
      vscode.window.showInformationMessage(
        "Hello World from .gitkeep creator!",
      );

      const result = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: "Seleccionar carpeta",
      });

      if (result && result.length > 0) {
        const folderPath = result[0].fsPath;
      }
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
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "selectFolder") {
        const result = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
        });

        if (result && result.length > 0) {
          webviewView.webview.postMessage({
            command: "setFolder",
            path: result[0].fsPath,
          });
        }
      }
    });
    webviewView.webview.html = `
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
          <button type="button" style="border-radius: 3px; color: white; background:#2b7da3; height: 2rem; width:100%;">Add</button>
          <button type="button" style="border-radius: 3px; background:red; width: 2rem; height: 2rem;">
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
          <button onclick="selectFolder()" type="button" style="border-radius: 3px; width: 2rem; height: 2rem;">...</button>
        </div>

        <pre style="
          border-radius: 3px;
          width: 100%; 
          height: 300px; 
          border: solid 1px black;
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

        window.addEventListener("message", event => {
          const message = event.data;

          if (message.command === "setFolder") {
            document.getElementById("pathInput").value = message.path;
          }
        });
      </script>
    </html>
  `;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
