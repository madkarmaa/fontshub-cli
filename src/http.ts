import { ResponseSchema } from './schemas';
import { URL } from './utils';

export const fetchFonts = async () => {
    const res = await fetch(URL);

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to fetch fonts (${res.status})\n${res.statusText}`,
        );

    const data = await res.json();
    return ResponseSchema.parse(data);
};
