export async function acquireAndConstruct<T extends { dispose(): void }, Result>(
  acquire: () => Promise<T>,
  construct: (resource: T) => Result,
) {
  const resource = await acquire();
  try {
    return construct(resource);
  } catch (error) {
    resource.dispose();
    throw error;
  }
}
