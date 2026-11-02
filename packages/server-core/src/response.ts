/** Success body: { success: true, data }. */
export const success = <T>(data: T) => ({ success: true as const, data })
