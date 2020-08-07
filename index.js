if (typeof require === 'function') {
    throw new Error('RequireDir can only be imported as an ES Module');
}

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const importDir = (directory = '.', options = {}) => {
    const
        __filename = fileURLToPath(import.meta.url),
        __dirname = path.dirname(__filename);

    directory = path.resolve(__dirname, directory);

    const
        files = fs.readdirSync(directory),
        filesBase = {};

    for (const file of files) {
        const
            ext = path.extname(file),
            base = path.basename(file, ext);

        (filesBase[base] = filesBase[base] || []).push(file);
    }

    const
        map = {},
        extensions = options.extensions || ['.js'];

    for (const base in filesBase) {
        if (!filesBase.hasOwnProperty(base)) {
            continue;
        }

        const
            files = filesBase[base],
            filesMinusDirs = {};

        for (const file of files) {
            const abs = path.resolve(directory, file);

            if (fs.statSync(abs).isDirectory()) {
                if (options.recurse && base != 'node_modules') {
                    map[base] = importDir(abs, options);
                }
            }
            else {
                filesMinusDirs[file] = abs;
            }
        }

        if (map[base]) {
            continue;
        }

        for (const ext of extensions) {
            const
                file = base + ext,
                abs = filesMinusDirs[file];

            if (abs) {
                if (options.noCache) {
                    map[base] = import(`${abs}?r=${Date.now()}`);

                    break;
                }

                map[base] = import(abs);
                break;
            }
        }
    }

    return map;
};

export default importDir;
