import { search } from '@inquirer/prompts';
import chalk from 'chalk';
import { downloadFont, getFonts, matchFont, parseArgs } from './utils';

const main = async () => {
    const [query] = parseArgs(process.argv);
    const fonts = await getFonts();
    let font = query ? matchFont(fonts, query) : undefined;

    if (query && !font)
        console.log(
            chalk.dim.italic.yellow(
                'No matching font found, starting interactive search...',
            ),
        );

    if (!font)
        font = await search({
            message: 'Select a font to download:',
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

    await downloadFont(font, `${font.name.replaceAll(' ', '_')}.zip`);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
