import * as z from 'zod';

export const ResponseSchema = z
    .record(z.string(), z.string())
    .transform((obj) =>
        Object.entries(obj).map(([name, id]) => ({ name, id })),
    );
export type ResponseType = z.infer<typeof ResponseSchema>;
