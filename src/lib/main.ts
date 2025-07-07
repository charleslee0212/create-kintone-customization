import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import {
  createFieldCodeFile,
  createFieldTypeFile,
  generateKintoneEnv,
  getAllApps,
  getAllFormFields,
  getFormFields,
  promptAppSelection,
  promptCredentials,
  promptEvents,
  promptLanguage,
  promptReact,
  promptRelatedApps,
  promptUrl,
  propmtProjectName,
} from './util.js';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export default async () => {
  const urlRegex = /^https:\/\/([a-zA-Z0-9-]+)\.kintone\.com$/;
  const allowedFlags = [
    'tools',
    't',
    'add-app-fields',
    'addAppFields',
    'add-app-types',
    'addAppTypes',
  ];

  const argv = await yargs(hideBin(process.argv))
    .option('tools', {
      type: 'boolean',
      alias: 't',
      description: 'Enables tools mode',
      default: false,
    })
    .option('add-app-fields', {
      type: 'boolean',
      description: 'Adds a file containing the field codes',
      default: false,
    })
    .option('add-app-types', {
      type: 'boolean',
      description: 'Adds a file containing the field types',
      default: false,
    })
    .check((argv) => {
      if (argv._.length > 0) {
        throw new Error(`❌ Unexpected argument(s): ${argv._.join(', ')}`);
      }

      const providedFlags = Object.keys(argv).filter(
        (key) => argv[key] && !['_', '$0'].includes(key)
      );

      const invalidFlags = providedFlags.filter(
        (flag) => !allowedFlags.includes(flag)
      );

      if (invalidFlags.length > 0) {
        throw new Error(
          `❌ Invalid flags provided: ${invalidFlags.join(', ')}`
        );
      }
      if (argv.tools && !(argv['add-app-fields'] || argv['add-app-types'])) {
        throw new Error(
          '❌ When using the --tools flag, you must specify a tool:\n--add-app-fields\n--add-app-types'
        );
      }
      if ((argv['add-app-fields'] || argv['add-app-types']) && !argv.tools) {
        throw new Error('❌ The --tools flag is required when using a tool');
      }
      return true;
    })
    .help().argv;

  const projectName = argv.tools ? '' : await propmtProjectName();
  const url = await promptUrl();
  const validUrl = urlRegex.test(url);

  if (!validUrl) {
    return console.error(
      '❌ Invalid url! Please format the url as follows "https://example.kintone.com".'
    );
  }

  const [username, password] = await promptCredentials();

  const client = new KintoneRestAPIClient({
    baseUrl: url,
    auth: {
      username: username,
      password: password,
    },
  });

  const allApps = await getAllApps(client);

  if (!allApps)
    return console.error(
      'Unable to retrieve your apps! Check your credentials.'
    );

  const selectedApp = await promptAppSelection(allApps);
  const selectedAppFormFields = await getFormFields(client, selectedApp);

  if (argv.tools) {
    if (argv['add-app-fields']) {
      const language = await promptLanguage();
      createFieldCodeFile(
        process.cwd(),
        selectedApp,
        selectedAppFormFields,
        language
      );
      return;
    }
    if (argv['add-app-types']) {
      createFieldTypeFile(process.cwd(), selectedApp, selectedAppFormFields);
      return;
    }
  }

  const relatedApps = await promptRelatedApps(allApps, selectedApp);
  const relatedAppsFormFields = await getAllFormFields(client, relatedApps);

  const events = await promptEvents();

  const language = await promptLanguage();

  const react = await promptReact();

  generateKintoneEnv(
    projectName,
    events,
    selectedApp,
    selectedAppFormFields,
    relatedApps,
    relatedAppsFormFields,
    language,
    react
  );
};
