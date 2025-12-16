import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStreamReadResult } from 'node:stream/web';
import chalk from 'chalk';
import { load as parseHTML } from 'cheerio';
import { Presets, SingleBar } from 'cli-progress';
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
    const parsed = ResponseSchema.parse(data);

    console.log(chalk.dim.italic.green(`Fetched ${parsed.length} fonts.`));

    return parsed;
};

export const matchFont = (fonts: Font[], query: string) =>
    fonts.find(
        (font) =>
            font.name.trim().toLowerCase() === query.trim().toLowerCase() ||
            font.id === query.trim(),
    );

export const getFontPageId = async (font: Font) => {
    const res = await fetch(fontPageUrl(font.id));

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to fetch font page (${res.status})\n${res.statusText}`,
        );

    const html = await res.text();
    const $ = parseHTML(html);
    const pageId = $('#fontPage').data('id');

    if (!pageId || typeof pageId !== 'string')
        throw new Error('Font page ID not found.');

    return pageId.trim() as FontPageId;
};

export const downloadFont = async (font: Font, destination: string) => {
    const pageId = await getFontPageId(font);
    const res = await fetch(fontDownloadUrl(pageId));

    if (!res.ok || !res.body)
        throw new Error(
            `Failed to download font (${res.status})\n${res.statusText}`,
        );

    const size = Number(res.headers.get('Content-Length'));
    const bar = new SingleBar(
        {
            format: `Downloading {bar} ${chalk.bold('{percentage}%')} ${chalk.dim.italic(`<{value}/{total} bytes>`)}`,
            hideCursor: true,
        },
        Presets.shades_classic,
    );

    const fileStream = createWriteStream(destination);

    if (!size || Number.isNaN(size))
        return await pipeline(Readable.fromWeb(res.body), fileStream);

    bar.start(size, 0);
    let downloaded = 0;

    const reader = res.body.getReader();
    const stream = new Readable({
        async read() {
            try {
                const { done, value }: ReadableStreamReadResult<Uint8Array> =
                    await reader.read();

                if (done) {
                    this.push(null);
                    bar.stop();
                    return;
                }

                downloaded += value.length || 0;
                bar.update(downloaded);
                this.push(value);
            } catch {
                this.destroy(new Error('Error reading the download stream.'));
                bar.stop();
            }
        },
    });

    await pipeline(stream, fileStream);
    console.log(chalk.green(`Downloaded font to ${chalk.bold(destination)}`));
};
