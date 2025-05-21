import inquirer from 'inquirer';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { excludeTypes, kintoneEvents, eventCategories } from './constants.js';
import convertToFieldType from './convertToFieldType.js';
import { getEventType } from './getEventType.js';

// kintone types
type AppsType = Awaited<
  ReturnType<InstanceType<typeof KintoneRestAPIClient>['app']['getApps']>
>['apps'];

type PropertiesType = Awaited<
  ReturnType<InstanceType<typeof KintoneRestAPIClient>['app']['getFormFields']>
>['properties'];

// prompt functions
export const propmtProjectName: () => Promise<string> = async () => {
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Please enter the name of your project:',
    },
  ]);

  return projectName;
};

export const promptUrl: () => Promise<string> = async () => {
  const { url } = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message:
        'Please enter your Kintone domain url (ex. https://example.kintone.com):',
    },
  ]);

  return url as string;
};

export const promptCredentials: () => Promise<[string, string]> = async () => {
  const { username, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: 'Enter your Kintone username:',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your Kintone password:',
    },
  ]);

  return [username as string, password as string];
};

export const promptAppSelection: (
  allApps: AppsType
) => Promise<{ appId: string; appName: string }> = async (allApps) => {
  const { selectedApp } = await inquirer.prompt([
    {
      type: 'search',
      name: 'selectedApp',
      message: 'Select the app where the code will be uploaded:',
      pageSize: 5,
      source: async (input) => {
        if (!input) {
          return allApps.map((app) => `${app.name} | ${app.appId}`);
        }
        return allApps
          .filter(
            (app) =>
              input === `${app.name} | ${app.appId}` ||
              input
                .toLowerCase()
                .split(' ')
                .filter((word) => word)
                .every((word) =>
                  `${app.name} ${app.appId}`.toLowerCase().includes(word)
                )
          )
          .map((app) => `${app.name} | ${app.appId}`);
      },
    },
  ]);

  const appData = {
    appId: selectedApp.split(' ').at(-1)!,
    appName: selectedApp.split(' ').slice(0, -2).join('_'),
  };

  return appData;
};

export const promptRelatedApps: (
  allApps: AppsType,
  exclude: { appId: string; appName: string }
) => Promise<{ appId: string; appName: string }[]> = async (
  allApps,
  exclude
) => {
  const selectedApps: string[] = [];

  const { need } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'need',
      message: 'Would you like to select related apps?',
      default: false,
    },
  ]);

  if (!need) return [];

  let continueSelecting = true;

  while (continueSelecting) {
    if (selectedApps.length) {
      console.log('Selected Apps:');
      selectedApps.forEach((app, i) => {
        console.log(`${i + 1}. ${app}`);
      });
      console.log();
    }

    const { selectedApp } = await inquirer.prompt([
      {
        type: 'search',
        name: 'selectedApp',
        message: 'Select an app that is related to this customization:',
        pageSize: 5,
        source: async (input) => {
          if (!input) {
            return allApps
              .filter(
                (app) =>
                  exclude.appId !== app.appId &&
                  !selectedApps.includes(`${app.name} | ${app.appId}`)
              )
              .map((app) => `${app.name} | ${app.appId}`);
          }
          return allApps
            .filter(
              (app) =>
                exclude.appId !== app.appId &&
                !selectedApps.includes(`${app.name} | ${app.appId}`) &&
                (input === `${app.name} | ${app.appId}` ||
                  input
                    .toLowerCase()
                    .split(' ')
                    .filter((word) => word)
                    .every(
                      (word) =>
                        word &&
                        `${app.name} ${app.appId}`.toLowerCase().includes(word)
                    ))
            )
            .map((app) => `${app.name} | ${app.appId}`);
        },
      },
    ]);
    selectedApps.push(selectedApp);

    const { again } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'again',
        message: 'Would you like to select another app?',
        default: false,
      },
    ]);

    continueSelecting = again;
  }

  if (selectedApps.length) {
    console.log('Selected Apps:');
    selectedApps.forEach((app, i) => {
      console.log(`${i + 1}. ${app}`);
    });
    console.log();
  }

  return selectedApps.map((app) => ({
    appId: app.split(' ').at(-1)!,
    appName: app.split(' ').slice(0, -2).join('_'),
  }));
};

export const promptEvents: () => Promise<string[]> = async () => {
  let continueSelecting = true;
  const events: string[] = [];

  while (continueSelecting) {
    if (events.length) {
      console.log('Selected Events:');
      events.forEach((app, i) => {
        console.log(`${i + 1}. ${app}`);
      });
      console.log();
    }

    const { event } = await inquirer.prompt([
      {
        type: 'search',
        name: 'event',
        pageSize: 5,
        message:
          'Please select the event you want to include in your customization:',
        choices: kintoneEvents,
        source: async (input) => {
          if (!input) {
            return kintoneEvents.filter((event) => !events.includes(event));
          }
          return kintoneEvents.filter(
            (event) =>
              !events.includes(event) &&
              (input === event ||
                input
                  .split('.')
                  .filter((word) => word)
                  .every((word) => event.includes(word)))
          );
        },
      },
    ]);
    events.push(event);

    const { again } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'again',
        message: 'Would you like to select another event?',
        default: false,
      },
    ]);

    continueSelecting = again;
  }

  if (events.length) {
    console.log('Selected Events:');
    events.forEach((app, i) => {
      console.log(`${i + 1}. ${app}`);
    });
    console.log();
  }

  return events;
};

export const promptLanguage: () => Promise<string> = async () => {
  const { language } = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Which language do you want to use?',
      choices: ['TypeScript [TS]', 'JavaScript [JS]'],
    },
  ]);

  return language;
};

export const promptReact: () => Promise<boolean> = async () => {
  const { react } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'react',
      message: 'Would you like to use React.js?',
      default: false,
    },
  ]);

  return react;
};

// fetch functions

export const getAllApps: (
  client: KintoneRestAPIClient
) => Promise<AppsType | undefined> = async (client) => {
  const allApps: AppsType = [];
  const spinner = ora('Fetching all apps...').start();
  try {
    let offset = 0;
    while (!(offset % 100)) {
      const { apps } = await client.app.getApps({
        offset: offset,
      });
      if (!apps.length) break;
      allApps.push(...apps);
      offset += 100;
      spinner.text = `Fetched ${allApps.length} apps`;
    }
    spinner.succeed('All apps fetched!');
  } catch (e) {
    spinner.fail('Failed to fetch apps!');
    return;
  }

  return allApps;
};

export const getFormFields: (
  client: KintoneRestAPIClient,
  app: { appId: string; appName: string }
) => Promise<PropertiesType> = async (client, app) => {
  const { properties } = await client.app.getFormFields({
    app: app.appId,
  });

  return properties;
};

export const getAllFormFields: (
  client: KintoneRestAPIClient,
  apps: { appId: string; appName: string }[]
) => Promise<PropertiesType[]> = async (client, apps) => {
  const allProperties: PropertiesType[] = [];

  for (const app of apps) {
    const { properties } = await client.app.getFormFields({
      app: app.appId,
    });

    allProperties.push(properties);
  }

  return allProperties;
};

// generate env for kintone customization
const createType: (
  appProperties: PropertiesType,
  createEvent: boolean
) => string = (appProperties, createEvent) => {
  let typeDef = `{`;
  const header =
    '\n\t$id: KintoneRecordField.ID;\n\t$revision: KintoneRecordField.Revision;';
  if (!createEvent) typeDef += header;
  for (const [fieldCode, fieldData] of Object.entries(appProperties)) {
    if (fieldData.type === 'SUBTABLE') {
      typeDef += `\n\t${fieldCode}: {
    type: 'SUBTABLE';
    value: Array<{
      id: string;
      value: {
        ${Object.entries(fieldData.fields)
          .map(
            ([tFieldCode, tFieldData]) =>
              `${tFieldCode}: KintoneRecordField.${convertToFieldType(
                tFieldData.type
              )};`
          )
          .join('\n\t\t\t\t')}
    }
  }>;
}`;
    }
    if (createEvent && excludeTypes.includes(fieldData.type)) continue;
    const fieldType = convertToFieldType(fieldData.type);
    if (!fieldType) continue;
    typeDef += `\n\t${fieldCode}: KintoneRecordField.${fieldType};`;
  }

  typeDef += '\n};';

  return typeDef;
};

const createEventType: (
  events: string[],
  appProperties: PropertiesType
) => string = (events, appProperties) => {
  let typeDefs = '';
  const tracker = new Set<string>();
  for (const event of events) {
    if (eventCategories.list.includes(event) && !tracker.has('list')) {
      const recordType = createType(appProperties, false);
      typeDefs +=
        '\n' +
        getEventType(
          'list',
          recordType.slice(0, -1) + '[]' + recordType.slice(-1)
        );
      tracker.add('list');
    }
    if (eventCategories.record.includes(event) && !tracker.has('record')) {
      const recordType = createType(appProperties, false);
      typeDefs += '\n' + getEventType('record', recordType);
      tracker.add('record');
    }
    if (eventCategories.create.includes(event) && !tracker.has('create')) {
      const recordType = createType(appProperties, true);
      typeDefs += '\n' + getEventType('create', recordType);
      tracker.add('create');
    }
    if (
      eventCategories.createShow.includes(event) &&
      !tracker.has('createShow')
    ) {
      const recordType = createType(appProperties, true);
      typeDefs += '\n' + getEventType('createShow', recordType);
      tracker.add('createShow');
    }
    if (eventCategories.report.includes(event) && !tracker.has('report')) {
      const recordType = createType(appProperties, false);
      typeDefs += '\n' + getEventType('report', recordType);
      tracker.add('report');
    }
    if (eventCategories.portal.includes(event) && !tracker.has('portal')) {
      const recordType = createType(appProperties, false);
      typeDefs += '\n' + getEventType('portal', recordType);
      tracker.add('portal');
    }
    if (
      eventCategories.spacePortal.includes(event) &&
      !tracker.has('spacePortal')
    ) {
      const recordType = createType(appProperties, false);
      typeDefs += '\n' + getEventType('spacePortal', recordType);
      tracker.add('spacePortal');
    }
  }

  return typeDefs;
};

const createPackage: (dir: string, projectName: string) => void = async (
  dir,
  projectName
) => {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: '',
    main: '.eslintrc.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
      'build:dev':
        'webpack --mode=development --devtool eval-source-map --output-pathinfo --watch',
      'build:prod': 'webpack --mode=production',
    },
  };
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
};

const createWebpack: (
  dir: string,
  selectedApp: {
    appId: string;
    appName: string;
  },
  language: string,
  react: boolean
) => void = (dir, selectedApp, language, react) => {
  const webpack = `const path = require('path');${
    language[0] === 'T'
      ? `\nconst ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');\n`
      : ''
  }
module.exports = {
  entry: {
    ${selectedApp.appName}: './${selectedApp.appName}/${
    language[0] === 'T' ? 'ts' : 'js'
  }/main.${
    language[0] === 'T' ? (react ? 'tsx' : 'ts') : react ? 'jsx' : 'js'
  }',
  },
  output: {
    path: __dirname + '/',
    filename: 'dist/[name]_bundle.js'
  },
  resolve: {
    alias: {
      modules: path.join(__dirname, 'node_modules'),
      common: path.join(__dirname, 'common')
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },${
    language[0] === 'T'
      ? `
    plugins: [new ForkTsCheckerWebpackPlugin()],`
      : ''
  }
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf)(\\?v=\\d+\\.\\d+\\.\\d+)?$/i,
        use: ['url-loader'],
      },
      {
        test: /\\.(ts|js)x?$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [${(() => {
              let presents = '';
              if (language[0] === 'T')
                presents += `
              '@babel/preset-typescript',`;
              if (react)
                presents += `
              ['@babel/preset-react', { runtime: 'automatic' }],`;
              if (presents)
                presents += `
              `;
              return presents;
            })()}
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 4 versions'],
                  },
                  useBuiltIns: 'usage',
                  corejs: 3,
                }
              ]
            ]
          }
        }
      }
    ]
  }
};`;
  fs.writeFileSync(path.join(dir, 'webpack.config.js'), webpack);
};

const creategitignore: (dir: string) => void = (dir) => {
  const gitignore = '.DS_Store' + '\nnode_modules' + '\ndist';
  fs.writeFileSync(path.join(dir, '.gitignore'), gitignore);
};

const createDir: (
  dir: string,
  language: string,
  react: boolean,
  selectedApp: { appId: string; appName: string },
  selectedAppProperties: PropertiesType,
  relatedApps: { appId: string; appName: string }[],
  relatedAppsProperties: PropertiesType[],
  events: string[]
) => void = (
  dir,
  language,
  react,
  selectedApp,
  selectedAppProperties,
  relatedApps,
  relatedAppsProperties,
  events
) => {
  const srcPath = path.join(dir, 'src');
  fs.mkdirSync(srcPath, { recursive: true });

  const cssPath = path.join(dir, 'css');
  fs.mkdirSync(cssPath, { recursive: true });

  const commonPath = path.join(dir, 'common');
  fs.mkdirSync(commonPath, { recursive: true });

  const codePath = path.join(srcPath, language[0] === 'T' ? 'ts' : 'js');
  fs.mkdirSync(codePath, { recursive: true });

  const codeFilePath = path.join(
    codePath,
    `main.${
      language[0] === 'T' ? (react ? 'tsx' : 'ts') : react ? 'jsx' : 'js'
    }`
  );

  const codeFile = `import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { KintoneEvent } from './lib/types';

const client = new KintoneRestAPIClient();

(() => {

  kintone.events.on('app.record.index.show', (event${
    language[0] ? ': KintoneEvent' : ''
  }) => {

  });

  kintone.events.on('mobile.app.record.index.show', (event${
    language[0] ? ': KintoneEvent' : ''
  }) => {

  });

})();`;
  fs.writeFileSync(codeFilePath, codeFile);

  const libPath = path.join(codePath, 'lib');
  fs.mkdirSync(libPath, { recursive: true });

  const typeFilePath = path.join(libPath, `type.ts`);
  const typeFile = `import { KintoneRecordField } from '@kintone/rest-api-client';
${
  `export type ${selectedApp.appName.replaceAll('_', '')} = ` +
  createType(selectedAppProperties, false)
}${
    relatedApps.length
      ? '\n' +
        relatedApps
          .map(
            (app, i) =>
              `export type ${app.appName.replaceAll('_', '')} = ` +
              createType(relatedAppsProperties[i], false)
          )
          .join('\n')
      : ''
  }${createEventType(events, selectedAppProperties)}
`;
  fs.writeFileSync(typeFilePath, typeFile);
};

export const generateKintoneEnv: (
  projectName: string,
  events: string[],
  selectedApp: { appId: string; appName: string },
  selectedAppProperties: PropertiesType,
  relatedApps: { appId: string; appName: string }[],
  relatedAppsProperties: PropertiesType[],
  language: string,
  react: boolean
) => void = (
  projectName,
  events,
  selectedApp,
  selectedAppProperties,
  relatedApps,
  relatedAppsProperties,
  language,
  react
) => {
  const dir = path.join(process.cwd(), selectedApp.appName);
  fs.mkdirSync(dir, { recursive: true });
  createPackage(dir, projectName);
  createWebpack(dir, selectedApp, language, react);
  creategitignore(dir);
  createDir(
    dir,
    language,
    react,
    selectedApp,
    selectedAppProperties,
    relatedApps,
    relatedAppsProperties,
    events
  );
};
