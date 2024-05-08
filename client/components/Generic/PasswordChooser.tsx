import React from 'react';
import { NxField } from './NxField';
import {
  Button,
  Form,
  Header,
  Icon,
  Message,
  Segment,
} from 'semantic-ui-react';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import { AutoKeyMap } from '../../events/AutoKeyMap';

const capsLockWarnStyle: React.CSSProperties = {
  padding: 10,
  paddingLeft: 19,
  color: '#000',
};

interface Props {
  header: JSX.Element | string,
  body: JSX.Element | string | null,
  help?: JSX.Element | string | null | undefined,
  noConfirm?: boolean,
  usernameHint?: string,
  autoComplete?: string,
  onChoosePassword: Function,
}

class PasswordChooser extends React.Component<Props> {
  autoKeyMap = new AutoKeyMap({ stealFocus: true });
  state = {
    password: '',
    confirmPassword: '',
    error: '',
  };

  componentDidMount() {
    this.autoKeyMap.bindKeys({
      Enter: this.handleSubmit,
      NumpadEnter: this.handleSubmit,
      Escape: this.handleClear,
    });
  }

  componentWillUnmount() {
    this.autoKeyMap.destroy();
  }

  handleSubmit = () => {
    const noConfirm = this.props.noConfirm;
    if (!noConfirm && (this.state.password !== this.state.confirmPassword)) {
      return this.setState({
        error: 'Passwords do not match.',
      });
    }

    this.props.onChoosePassword(this.state.password);
  };

  handleClear = () => {
    this.setState({
      password: '',
      confirmPassword: '',
      error: '',
    });
  };

  render() {
    const {
      header, body, help, noConfirm, autoComplete, usernameHint,
    } = this.props;
    const { password, confirmPassword, error } = this.state;
    const labelText = noConfirm ? 'Password' : 'Password (leave empty to skip)';
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    return (
      <Segment style={{ textAlign: 'left' }} inverted={!darkMode}>
        <Header>{header}</Header>
        {body}

        <Form>
          <NxField
            label={labelText}
            help={help}
            autoFocus
            placeholder={noConfirm ? 'Password' : 'Optional Password'}
            value={password}
            usernameHint={usernameHint}
            isPassword={true}
            autoComplete={autoComplete || 'on'}
            onChange={(event: { target: { value: string; }; }) => {
              this.setState({ password: event.target.value });
            }}
          />

          <NxField
            label="Confirm Password"
            visible={!!password && !noConfirm}
            placeholder={'Confirm Password'}
            value={confirmPassword}
            isPassword={true}
            autoComplete={'on'}
            onChange={(event: { target: { value: string; }; }) => {
              this.setState({ confirmPassword: event.target.value });
            }}
          />

          {AutoKeyMap.capsLockOn &&
            <Message color="yellow" style={capsLockWarnStyle}>
              <i>Note: Caps Lock is on</i>
            </Message>}

          {error && <Message>{error}</Message>}

          <Button
            icon
            color="green"
            type="button"
            labelPosition="left"
            onClick={this.handleSubmit}
          >
            <Icon name="key"/>
            Continue
          </Button>
        </Form>

      </Segment>
    );
  }
}

export {
  PasswordChooser,
};
