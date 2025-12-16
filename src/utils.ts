import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import * as cheerio from 'cheerio';
import { ResponseSchema } from './schemas';
import type { Font, FontId, FontPageId } from './types';

export const ALL_FONTS_URL =
    'https://fontshub.pro/font/search-list/get' as const;

export const parseArgs = (args: string[]) =>
    args
        .slice(2)
        .map((arg) => arg.trim())
        .filter((arg) => arg && arg.length > 0);

export const fontPageUrl = (id: FontId) =>
    `https://fontshub.pro/font/${id}-download` as const;

export const fontDownloadUrl = (id: FontPageId) =>
    `https://fontshub.pro/f-files/${id}/font.zip` as const;

export const getFonts = async () => {
    const res = await fetch(ALL_FONTS_URL);

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to fetch fonts (${res.status})\n${res.statusText}`,
        );

    const data = await res.json();
    return ResponseSchema.parse(data);
};

export const matchFont = (fonts: Font[], query: string | undefined) =>
    fonts.find(
        (font) =>
            font.name.trim().toLowerCase() === query?.trim().toLowerCase() ||
            font.id === query?.trim(),
    );

export const getFontPageId = async (font: Font) => {
    const res = await fetch(fontPageUrl(font.id));

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to fetch font page (${res.status})\n${res.statusText}`,
        );

    const html = await res.text();
    const $ = cheerio.load(html);
    const pageId = $('#fontPage').data('id');

    if (!pageId || typeof pageId !== 'string')
        throw new Error('Font page ID not found.');

    return pageId.trim() as FontPageId;
};

export const downloadFont = async (pageId: FontPageId, destination: string) => {
    const res = await fetch(fontDownloadUrl(pageId));

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to download font (${res.status})\n${res.statusText}`,
        );

    await pipeline(
        Readable.fromWeb(res.body as unknown as ReadableStream),
        createWriteStream(destination),
    );
};
