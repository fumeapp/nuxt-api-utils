type PolicyFunction<T extends object> = (args: T) => boolean | Promise<boolean>

export async function authorize<T extends object>(
  policyFunction: PolicyFunction<T>,
  args: T,
): Promise<void> {
  if (!await Promise.resolve(policyFunction(args))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
