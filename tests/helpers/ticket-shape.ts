/** `taskService.createTicket`/`getTicket`/`updateTicket` return `Record<string,
 * unknown>` (serialized ad hoc in task.service.ts), so integration tests that
 * read fields off the result need a local shape to avoid `unknown` everywhere. */
export type TestTicket = {
  id: string;
  epicId: string | null;
  parentTaskId: string | null;
  sprintId: string | null;
  status: string;
  dependsOn: unknown[];
};

export function asTestTicket(value: unknown): TestTicket {
  return value as TestTicket;
}
