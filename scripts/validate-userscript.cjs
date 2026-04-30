const fs = require('node:fs');
const { USERSCRIPT_METADATA } = require('../userscript.metadata.cjs');

const scriptPath = 'WTR Lab Stalker.user.js';
const script = fs.readFileSync(scriptPath, 'utf8');
const required = [
    '@name',
    '@namespace',
    '@version',
    '@description',
    '@author',
    '@match',
    '@icon',
    '@license',
    '@compatible   scriptcat',
    '@compatible   violentmonkey',
    '@compatible   stay',
    '@compatible   tampermonkey',
    '@run-at       document-start',
    '@noframes',
    '@grant        none',
];

if (!script.startsWith(USERSCRIPT_METADATA)) {
    throw new Error('Generated userscript does not start with the expected metadata header.');
}

for (const key of required) {
    if (!script.includes(key)) {
        throw new Error(`Missing required metadata field: ${key}`);
    }
}

const namespace = script.match(/@namespace\s+([^\s]+)/)?.[1];
if (namespace !== 'https://docs.scriptcat.org/en/') {
    throw new Error(`Invalid @namespace value: ${namespace ?? 'missing'}`);
}

const version = script.match(/@version\s+([^\s]+)/)?.[1];
if (!version || !/^\d+\.\d+(\.\d+)?$/.test(version)) {
    throw new Error(`Invalid @version value: ${version ?? 'missing'}`);
}

console.log(`Validated ${scriptPath} metadata version ${version} with namespace ${namespace}.`);
