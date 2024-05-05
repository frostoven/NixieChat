import React from 'react';
import { Form } from 'semantic-ui-react';
import { Settings } from '../../../storage/cacheFrontends/Settings';

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
    const darkMode = Settings.isDarkModeEnabled() || false;

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
