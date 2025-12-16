import { readFile, writeFile } from 'node:fs/promises';
import { cancel, intro, isCancel, outro, text } from '@clack/prompts';
import { $ } from 'bun';

const FILES_TO_UPDATE = ['package.json', 'README.md', 'bun.lock', 'LICENSE'];

(async () => {
    intro('Setup');

    const packageDescription = await text({
        message: 'Provide a short description of the package:',
    });

    if (isCancel(packageDescription)) {
        cancel('Operation cancelled.');
        process.exit(1);
    }

    const githubUrl = await $`git remote get-url origin`.quiet().text('utf-8');

    const parts = githubUrl.trim().split('/');
    const owner = parts[parts.length - 2].trim();
    const repoName = parts[parts.length - 1].replace('.git', '').trim();

    const year = new Date().getFullYear();

    for (const filePath of FILES_TO_UPDATE)
        try {
            let content = await readFile(filePath.trim(), 'utf-8');

            content = content
                .replaceAll('{{package.name}}', `@${owner}/${repoName}`)
                .replaceAll(
                    '{{package.description}}',
                    packageDescription.trim(),
                )
                .replaceAll('{{github.url}}', githubUrl.trim())
                .replaceAll('{{github.owner}}', owner)
                .replaceAll('{{github.repo}}', repoName)
                .replaceAll('{{year}}', year.toString());

            await writeFile(filePath.trim(), content, 'utf-8');
        } catch {}

    outro('Setup complete!');
})();
