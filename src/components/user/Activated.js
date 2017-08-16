import PropTypes from 'prop-types';
import React from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router';
import AppButton from '../common/AppButton';
import { ErrorNotice } from '../common/Notice';
import messages from '../..//resources/messages';

const localMessages = {
  workedTitle: { id: 'user.activated.worked.title', defaultMessage: 'Your Account is Activated' },
  workedInto: { id: 'user.activated.worked.intro', defaultMessage: 'Your Media Cloud account is now active!' },
  failedTitle: { id: 'user.activated.failed.title', defaultMessage: 'Account Activation Failed' },
  loginNow: { id: 'user.activated.login', defaultMessage: 'Login to Media Cloud' },
  invalidToken: { id: 'user.activated.invalidToken', defaultMessage: 'That is an invalid token.' },
  invalidTokenActions: { id: 'user.activated.invalidTokenActions', defaultMessage: 'You\'ve probably already activated your account, in which case <a href="/#/login">you can login now</a>.  If that isn\'t working, click the button to resend the acccount activation link.' },
  didNotWork: { id: 'user.activated.invalidTokenActions', defaultMessage: 'Sorry, but that didn\'t work for some reason.  Try the link again, or click the button below to resend the acccount activation link.' },
};

const Activated = (props) => {
  const { formatMessage } = props.intl;
  const success = props.location.query.success === '1';
  const msg = props.location.query.msg;
  const titleMsg = (success) ? localMessages.workedTitle : localMessages.failedTitle;
  let content = null;
  const resendContent = (
    <Link to="/user/resend-activation">
      <AppButton
        primary
        label={formatMessage(messages.resendActivation)}
      />
    </Link>
  );
  if (success) {
    content = (
      <div>
        <p><FormattedMessage {...localMessages.workedInto} /></p>
        <Link to="/login">
          <AppButton
            primary
            label={formatMessage(localMessages.loginNow)}
          />
        </Link>
      </div>
    );
  } else if (msg.includes('Activation token is invalid')) {
    content = (
      <div>
        <ErrorNotice>
          <FormattedMessage {...localMessages.invalidToken} />
        </ErrorNotice>
        <p><FormattedHTMLMessage {...localMessages.invalidTokenActions} /></p>
        {resendContent}
      </div>
    );
  } else {
    content = (
      <ErrorNotice>
        <FormattedMessage {...localMessages.didNotWork} />
        {resendContent}
      </ErrorNotice>
    );
  }
  return (
    <div className="activation-feedback">
      <Grid>
        <Row>
          <Col lg={12}>
            <h1><FormattedMessage {...titleMsg} /></h1>
            {content}
          </Col>
        </Row>
      </Grid>
    </div>
  );
};

Activated.propTypes = {
  location: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(Activated);
