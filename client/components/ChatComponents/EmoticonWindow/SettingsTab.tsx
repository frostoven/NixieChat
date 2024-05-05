import React from 'react';
import {
  DropdownProps,
  Form,
  FormSelect,
} from 'semantic-ui-react';
import { ContextualHelp } from '../../Generic/ContextualHelp';
import { Settings } from '../../../storage/cacheFrontends/Settings';

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  width: '80%',
  margin: 'auto',
};

const formStyle: React.CSSProperties = {
  textAlign: 'left',
};

interface Props {
  onRefreshNeeded: Function,
}

class SettingsTab extends React.Component<Props> {
  handleRichTextChange = (_: any, data: DropdownProps) => {
    Settings.setRichInputEnabled(data.value)
      .then(() => this.props.onRefreshNeeded())
      .catch((error) => console.error('[Settings] Input change:', error));
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled() || false;
    const richInputEnabled = Settings.richInputEnabled() || false;

    return (
      <div style={containerStyle}>
        <Form inverted={!darkMode} style={formStyle}>
          <Form.Field>
            <label>
              Text Input
              &nbsp;
              <ContextualHelp>
                You should use <i>Standard Input</i> unless you have a good
                reason not to. <i>Fallback Input</i> exists for very old
                devices. <i>Fallback Input</i> does not support emoticon
                insertion, but is extremely lightweight.
              </ContextualHelp>
            </label>
            <FormSelect
              className={`${darkMode ? '' : 'dropdown-light-mode'}`}
              fluid
              value={richInputEnabled}
              options={[
                { key: 'standard', text: 'Standard Input', value: true },
                { key: 'plain', text: 'Fallback Input', value: false },
              ]}
              onChange={this.handleRichTextChange}
            />
          </Form.Field>
        </Form>
      </div>
    );
  }
}

export {
  SettingsTab,
};
