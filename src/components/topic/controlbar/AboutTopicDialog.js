import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Link from 'react-router/lib/Link';
import messages from '../../../resources/messages';
import AppButton from '../../common/AppButton';
import { HelpButton } from '../../common/IconButton';
import TopicInfo from './TopicInfo';
import TopicStoryInfo from './TopicStoryInfo';

const localMessages = {
  aboutTopic: { id: 'topic.controlBar.about', defaultMessage: 'About' },
};

class AboutTopicDialog extends React.Component {
  state = {
    open: false,
  };

  handleClick = (evt) => {
    if (evt) {
      evt.preventDefault();
    }
    this.setState({ open: true });
  };

  handleRemoveDialogClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { topicInfo, filters } = this.props;
    const { formatMessage } = this.props.intl;
    return (
      <div className="about-topic">
        <HelpButton
          onClick={this.handleModifyClick}
          tooltip={formatMessage(localMessages.aboutTopic)}
        />
        <Link to={`${formatMessage(localMessages.aboutTopic)}`} onClick={this.handleClick}>
          <b><FormattedMessage {...localMessages.aboutTopic} /></b>
        </Link>
        <Dialog
          open={this.state.open}
          onClose={this.handleRemoveDialogClose}
        >
          <DialogTitle><FormattedMessage {...localMessages.aboutTopic} /></DialogTitle>
          <DialogContent>
            <TopicInfo topic={topicInfo} />
            <TopicStoryInfo topic={topicInfo} filters={filters} />
          </DialogContent>
          <DialogActions>
            <AppButton
              label={formatMessage(messages.ok)}
              onClick={this.handleRemoveDialogClose}
              key={0}
            />
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

AboutTopicDialog.propTypes = {
  // from context
  intl: PropTypes.object.isRequired,
  // from state
  topicInfo: PropTypes.object,
  filters: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  topicInfo: state.topics.selected.info,
  filters: state.topics.selected.filters,
});

export default
injectIntl(
  connect(mapStateToProps)(
    AboutTopicDialog
  )
);
