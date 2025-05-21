import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import {
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

export default async () => {
  const urlRegex = /^https:\/\/([a-zA-Z0-9-]+)\.kintone\.com$/;
  const projectName = await propmtProjectName();
  const url = await promptUrl();
  const validUrl = urlRegex.test(url);

  if (!validUrl) {
    return console.log(
      'Invalid url! Please format the url as follows "https://example.kintone.com".'
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
    return console.log('Unable to retrieve your apps! Check your credentials.');

  const selectedApp = await promptAppSelection(allApps);
  const relatedApps = await promptRelatedApps(allApps, selectedApp);

  const selectedAppFormFields = await getFormFields(client, selectedApp);
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
