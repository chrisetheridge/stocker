import type { SourcesRepository, SourceRecord } from '@stocker/db';

export type SourceStatusServiceDependencies = {
  readonly sourcesRepository: Pick<SourcesRepository, 'listSourceStatus'>;
};

export class SourceStatusService {
  constructor(private readonly dependencies: SourceStatusServiceDependencies) {}

  async listSourceStatus(): Promise<SourceRecord[]> {
    return this.dependencies.sourcesRepository.listSourceStatus();
  }
}

export function createSourceStatusService(
  dependencies: SourceStatusServiceDependencies,
): SourceStatusService {
  return new SourceStatusService(dependencies);
}
