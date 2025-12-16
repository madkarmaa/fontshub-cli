import { search } from '@inquirer/prompts';
import chalk from 'chalk';
import {
    fontDownloadUrl,
    getFontPageId,
    getFonts,
    matchFont,
    parseArgs,
} from './utils';

const main = async () => {
    const [query] = parseArgs(process.argv);
    const fonts = await getFonts();
    let font = matchFont(fonts, query);

    if (query && !font)
        console.log(
            chalk.yellow(
                'No matching font found, starting interactive search...',
            ),
        );

    if (!font)
        font = await search({
            message: 'Select a font:',
            source: async (input) =>
                !input
                    ? []
                    : fonts
                          .filter((font) =>
                              font.name
                                  .toLowerCase()
                                  .includes(input.toLowerCase()),
                          )
                          .map((font) => ({ name: font.name, value: font })),
        });

    const pageId = await getFontPageId(font);
    console.log(fontDownloadUrl(pageId));
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
