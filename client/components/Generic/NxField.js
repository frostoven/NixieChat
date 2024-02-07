import React from 'react';
import PropTypes from 'prop-types';
import { Form, Input } from 'semantic-ui-react';
import { ContextualHelp } from './ContextualHelp';
import { Settings } from '../../storage/cacheFrontends/Settings';

class NxField extends React.Component {
  static propTypes = {
    label: PropTypes.any,
    help: PropTypes.any,
    rightSideComponent: PropTypes.any,
    placeholder: PropTypes.any,
    value: PropTypes.any,
    autoFocus: PropTypes.bool,
    isPassword: PropTypes.bool,
    visible: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    label: '',
    help: null,
    rightSideComponent: null,
    placeholder: null,
    autoFocus: false,
    isPassword: false,
    visible: true,
    onChange: () => {
    },
  };

  render() {
    if (!this.props.visible) {
      return null;
    }

    const darkMode = Settings.isDarkModeEnabled() || false;

    const {
      label, help, rightSideComponent, placeholder, value, autoFocus,
      isPassword, onChange,
    } = this.props;
    return (
      <Form.Field>
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
          type={isPassword ? 'password' : 'text'}
          autoComplete={isPassword ? 'on' : null}
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
