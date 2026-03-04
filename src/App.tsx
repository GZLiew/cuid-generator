import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

function App() {
  const [cuid, setCuid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    const id = await invoke<string>("generate_cuid");
    await writeText(id);
    setCuid(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleCopy() {
    if (cuid) {
      await writeText(cuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <p
        className="font-mono text-3xl tracking-wide select-all cursor-pointer text-gray-800 mb-8 break-all text-center"
        onClick={handleCopy}
      >
        {cuid ?? "---"}
      </p>
      <button
        onClick={handleGenerate}
        className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
      >
        {copied ? "Copied!" : "Generate"}
      </button>
    </div>
  );
}

export default App;
