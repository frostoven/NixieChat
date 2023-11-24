import React from 'react';
import { LargeCircleIconButton } from '../Generic/LargeCircleIconButton';
import { Grid, GridColumn } from 'semantic-ui-react';

const containerStyle = {
  textAlign: 'center',
  maxWidth: 600,
  minWidth: 225,
};

const gridStyle = {
  paddingBottom: '25%',
};

const labelStyle = {
  backgroundColor: 'rgba(0,0,0,0.3)',
  padding: 4,
  borderRadius: 4,
};

const wideLabelStyle = {
  paddingTop: 80,
};

const separatorPcStyle = {
  textAlign: 'center',
  width: 200,
};

const separatorMobileStyle = {
  textAlign: 'center',
};

class CreateFirstContact extends React.Component {
  createChat = () => {
    //
  };

  render() {
    return (
      <div style={containerStyle}>
        <Grid stackable columns={3} style={gridStyle}>
          <GridColumn>
            <LargeCircleIconButton
              icon="user plus"
              label="Add your first contact"
              labelStyle={labelStyle}
            />
          </GridColumn>

          <GridColumn className="computer only tablet only"
                      style={wideLabelStyle}>
            <div style={separatorPcStyle}>
              <b style={labelStyle}>
                &mdash;&nbsp;&nbsp;or&nbsp;&nbsp;&mdash;
              </b>
            </div>
          </GridColumn>

          <GridColumn className="mobile only">
            <div style={separatorMobileStyle}>
              <b style={labelStyle}>
                &mdash;&nbsp;&nbsp;or&nbsp;&nbsp;&mdash;
              </b>
            </div>
          </GridColumn>

          <GridColumn>
            <LargeCircleIconButton
              icon="sticky note"
              label="Create encrypted notepad"
              labelStyle={labelStyle}
            />
          </GridColumn>
        </Grid>
      </div>
    );
  }
}

export {
  CreateFirstContact,
};
