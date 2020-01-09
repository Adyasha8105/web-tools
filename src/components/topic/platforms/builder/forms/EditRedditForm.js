import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import { injectIntl } from 'react-intl';
import { Row, Col } from 'react-flexbox-grid/lib';
import withIntlForm from '../../../../common/hocs/IntlForm';
import messages from '../../../../../resources/messages';

const EditRedditForm = ({ renderTextField, intl, onEnterKey }) => (
  <>
    <Row>
      <Col lg={8} xs={12}>
        <Field
          name="query"
          component={renderTextField}
          placeholder={intl.formatMessage(messages.searchByKeywords)}
          fullWidth
          onKeyDown={onEnterKey}
        />
      </Col>
    </Row>
    <Row>
      <Col lg={8} xs={12}>
        <Field
          name="channel"
          placeholder={intl.formatMessage(messages.searchByRedditChannel)}
          component={renderTextField}
          fullWidth
          onKeyDown={onEnterKey}
        />
      </Col>
    </Row>
  </>
);

EditRedditForm.propTypes = {
  // from parent
  initialValues: PropTypes.object,
  onEnterKey: PropTypes.func,
  // from dispatch
  onFormChange: PropTypes.func.isRequired,
  // from compositional helper
  intl: PropTypes.object.isRequired,
  renderTextField: PropTypes.func.isRequired,
};

const reduxFormConfig = {
  form: 'platform', // make sure this matches the sub-components and other wizard steps
  destroyOnUnmount: false, // <------ preserve form data
  forceUnregisterOnUnmount: true, // <------ unregister fields on unmount
  enableReinitialize: true,
};

export default
injectIntl(
  withIntlForm(
    reduxForm(reduxFormConfig)(
      EditRedditForm
    )
  )
);
