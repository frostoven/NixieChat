import React from 'react';
import { Form } from 'semantic-ui-react';
import {
  UnencryptedSettings,
} from '../../../storage/cacheFrontends/UnencryptedSettings';

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  width: '80%',
  margin: 'auto',
};

const formStyle: React.CSSProperties = {
  // textAlign: 'left',
};

class StickersTab extends React.Component {
  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled() || false;

    return (
      <div style={containerStyle}>
        <Form inverted={!darkMode} style={formStyle}>
          <Form.Field>
            <br/><br/>
            <label>
              The stickers feature is not yet available.
            </label>
          </Form.Field>
        </Form>
      </div>
    );
  }
}

export {
  StickersTab,
};
