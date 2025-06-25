export const getEventType: (
  type:
    | 'list'
    | 'record'
    | 'create'
    | 'createShow'
    | 'report'
    | 'portal'
    | 'spacePortal',
  recordType: string
) => string = (type, recordType) => {
  switch (type) {
    case 'list':
      return `export interface ListShowEvent {
  appId: number;
  viewType: string;
  viewId: number;
  viewName: string;
  records: ${recordType
    .replaceAll('\n\t', '\n\t\t')
    .replaceAll('\n};', '\n\t};')}
  offset: number;
  size: number;
  type: string;
}`;
    case 'record':
      return `export interface DefaultRecordEvent {
  appId: number;
  recordId: number;
  record: ${recordType
    .replaceAll('\n\t', '\n\t\t')
    .replaceAll('\n};', '\n\t};')}
  type: string;
}`;
    case 'create':
      return `export interface CreateRecordEvent {
  appId: number;
  recordId: number;
  record: ${recordType
    .replaceAll('\n\t', '\n\t\t')
    .replaceAll('\n};', '\n\t};')}
  type: string;
}`;
    case 'createShow':
      return `export interface CreateShowRecordEvent {
  appId: number;
  reuse: boolean;
  record: ${recordType
    .replaceAll('\n\t', '\n\t\t')
    .replaceAll('\n};', '\n\t};')}
  type: string;
}`;
    case 'report':
      return `export interface ReportEvent {
  appId: number;
  type: string;
}`;
    case 'portal':
      return `export interface PortalEvent {
  type: string;
}`;
    case 'spacePortal':
      return `export interface SpacePortalEvent {
  spaceId: string;
  type: string;
}`;
    default:
      return '';
  }
};
