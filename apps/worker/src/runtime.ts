export type WorkerRuntime = {
  readonly name: "@stocker/worker";
  readonly mode: "idle";
};

export function createWorkerRuntime(): WorkerRuntime {
  return {
    name: "@stocker/worker",
    mode: "idle",
  };
}
