import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'semantic-ui-react';
import { ContextualHelp } from './ContextualHelp';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';

class NxField extends React.Component {
  static propTypes = {
    label: PropTypes.any,
    help: PropTypes.any,
    rightSideComponent: PropTypes.any,
    placeholder: PropTypes.any,
    disabled: PropTypes.bool,
    value: PropTypes.any,
    autoFocus: PropTypes.bool,
    usernameHint: PropTypes.string,
    isPassword: PropTypes.bool,
    autoComplete: PropTypes.string,
    visible: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    label: '',
    help: null,
    rightSideComponent: null,
    placeholder: null,
    disabled: false,
    autoFocus: false,
    usernameHint: '',
    isPassword: false,
    autoComplete: 'on',
    visible: true,
    onChange: () => {
    },
  };

  render() {
    if (!this.props.visible) {
      return null;
    }

    const darkMode = UnencryptedSettings.isDarkModeEnabled() || false;

    const {
      label, help, rightSideComponent, placeholder, value, autoFocus,
      autoComplete, disabled, usernameHint, isPassword, onChange,
    } = this.props;
    return (
      <Form.Field>
        {
          // This spoofs a username field to allow password managers to
          // associate account names with passwords.
          // Further reading:
          // https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands/
          // https://www.chromium.org/developers/design-documents/create-amazing-password-forms/
          usernameHint ?
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              required
              value={usernameHint}
              disabled={disabled}
              style={{ display: 'none' }}
              onChange={() => {
              }}
            /> :
            null
        }
        <label>
          {label}
          &nbsp;
          {help ? <ContextualHelp>{help}</ContextualHelp> : null}
        </label>
        <Input
          inverted={!darkMode}
          action={!!rightSideComponent}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          type={isPassword ? 'password' : 'text'}
          autoComplete={isPassword ? autoComplete : null}
          onChange={onChange}
        >
          <input/>
          {rightSideComponent}
        </Input>
      </Form.Field>
    );
  }
}

export {
  NxField,
};
