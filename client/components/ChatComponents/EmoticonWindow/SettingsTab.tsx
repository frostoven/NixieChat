import React from 'react';
import {
  DropdownProps,
  Form,
  FormSelect,
} from 'semantic-ui-react';
import { ContextualHelp } from '../../Generic/ContextualHelp';
import {
  UnencryptedSettings,
} from '../../../storage/cacheFrontends/UnencryptedSettings';

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
    UnencryptedSettings.setRichInputEnabled(data.value)
      .catch((error) => console.error('[Settings] Input change:', error));
    // We don't need to wait for settings to write because our reads always
    // come from cached in-RAM values.
    this.props.onRefreshNeeded();
  };

  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled() || false;
    const richInputEnabled = UnencryptedSettings.richInputEnabled() || false;

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
