import { createWorkerRuntime } from "./runtime";

const runtime = createWorkerRuntime();

console.log(`[${runtime.name}] started in ${runtime.mode} mode`);
