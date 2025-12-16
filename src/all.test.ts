import { expect, test } from 'bun:test';
import { fontDownloadUrl, getFontPageId, getFonts } from './utils';

const fonts = await getFonts();

for (const font of fonts)
    test.concurrent(
        `Font ${font.name} ( ${font.id} ) has valid download`,
        async () => {
            const maxRetries = 5;
            const fetchTimeout = 20000;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const pageId = await getFontPageId(font);

                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                        () => controller.abort(),
                        fetchTimeout,
                    );

                    const res = await fetch(fontDownloadUrl(pageId), {
                        method: 'HEAD',
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);
                    expect(res.ok).toBe(true);
                    return; // Success, exit retry loop
                } catch (error) {
                    const isLastAttempt = attempt === maxRetries - 1;
                    const isTimeout =
                        error instanceof Error && error.name === 'AbortError';

                    if (isTimeout && !isLastAttempt) {
                        continue; // Retry only on timeout
                    }
                    throw error; // Fail immediately for non-timeout errors
                }
            }
        },
        { timeout: 0 },
    );
