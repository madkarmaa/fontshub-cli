import * as z from 'zod';
import type { Font, FontId } from './types';

export const ResponseSchema: z.ZodType<Font[]> = z
    .record(z.string(), z.string())
    .transform((obj) =>
        Object.entries(obj).map(([name, id]) => ({ name, id: id as FontId })),
    );
export type ResponseType = z.infer<typeof ResponseSchema>;
