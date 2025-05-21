const convertToFieldType: (field: string) => string = (field) => {
  switch (field) {
    case 'RECORD_NUMBER':
      return 'RecordNumber';
    case 'CREATOR':
      return 'Creator';
    case 'CREATED_TIME':
      return 'CreatedTime';
    case 'MODIFIER':
      return 'Modifier';
    case 'UPDATED_TIME':
      return 'UpdatedTime';
    case 'SINGLE_LINE_TEXT':
      return 'SingleLineText';
    case 'MULTI_LINE_TEXT':
      return 'MultiLineText';
    case 'RICH_TEXT':
      return 'RichText';
    case 'NUMBER':
      return 'Number';
    case 'CALC':
      return 'Calc';
    case 'CHECK_BOX':
      return 'CheckBox';
    case 'RADIO_BUTTON':
      return 'RadioButton';
    case 'MULTI_SELECT':
      return 'MultiSelect';
    case 'DROP_DOWN':
      return 'Dropdown';
    case 'USER_SELECT':
      return 'UserSelect';
    case 'ORGANIZATION_SELECT':
      return 'OrganizationSelect';
    case 'GROUP_SELECT':
      return 'GroupSelect';
    case 'DATE':
      return 'Date';
    case 'TIME':
      return 'Time';
    case 'DATETIME':
      return 'DateTime';
    case 'LINK':
      return 'Link';
    case 'FILE':
      return 'File';
    case 'CATEGORY':
      return 'Category';
    case 'STATUS':
      return 'Status';
    case 'STATUS_ASSIGNEE':
      return 'StatusAssignee';
    default:
      return '';
  }
};

export default convertToFieldType;
