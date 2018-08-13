import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl } from 'react-intl';
import { Row, Col } from 'react-flexbox-grid/lib';
import FlatButton from 'material-ui/FlatButton';

const selectionOptions = {
  none: 'none',
  match: 'match',
  notMatch: 'not-match',
};

const localMessages = {
  yesLabel: { id: 'topic.create.validate.btn.yes', defaultMessage: 'Yes' },
  noLabel: { id: 'topic.create.validate.btn.no', defaultMessage: 'No' },
};

class StoryFeedbackRow extends React.Component {

  state = {
    selection: selectionOptions.none,
  };

  handleMatch = () => {
    const { handleYesClick } = this.props;
    // update local state
    if (this.state.selection !== selectionOptions.match) {
      this.setState({ selection: selectionOptions.match });
    } else {
      // allow user to undo selection
      this.setState({ selection: selectionOptions.none });
    }
    // update parent state
    if (handleYesClick) {
      this.props.handleYesClick(selectionOptions, this.state.selection);
    }
  }

  handleNotAMatch = () => {
    const { handleNoClick } = this.props;
    // update local state
    if (this.state.selection !== selectionOptions.notMatch) {
      this.setState({ selection: selectionOptions.notMatch });
    } else {
      // allow user to undo selection
      this.setState({ selection: selectionOptions.none });
    }
    // update parent state
    if (handleNoClick) {
      this.props.handleNoClick(selectionOptions, this.state.selection);
    }
  }

  render() {
    const { story, maxTitleLength } = this.props;
    const { formatMessage, formatDate } = this.props.intl;
    const storyTitle = maxTitleLength !== undefined ? `${story.title.substr(0, maxTitleLength)}...` : story.title;

    return (
      <Row className={`story ${this.state.selection}`} middle="lg">
        <Col lg={8}>
          <Row>
            <Col lg={12}>
              <b><a href={story.url} rel="noopener noreferrer" target="_blank">{ storyTitle }</a></b>
            </Col>
          </Row>
          <Row>
            <Col lg={12}>
              { story.media_url }
            </Col>
          </Row>
          <Row>
            <Col lg={12}>
              { formatDate(story.publish_date, { year: 'numeric', month: 'numeric', day: 'numeric' }) }
            </Col>
          </Row>
        </Col>
        <Col lg={4}>
          <Row>
            <Col lg={6}>
              <FlatButton
                className={`match-btn${this.state.selection === selectionOptions.match ? '-selected' : ''}`}
                label={formatMessage(localMessages.yesLabel)}
                onClick={this.handleMatch}
              />
            </Col>
            <Col lg={6}>
              <FlatButton
                className={`not-match-btn${this.state.selection === selectionOptions.notMatch ? '-selected' : ''}`}
                label={formatMessage(localMessages.noLabel)}
                onClick={this.handleNotAMatch}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    );
  }
}

StoryFeedbackRow.propTypes = {
  // from parent
  story: PropTypes.object.isRequired,
  handleYesClick: PropTypes.func,
  handleNoClick: PropTypes.func,
  maxTitleLength: PropTypes.number,
  // from compositional helper
  intl: PropTypes.object.isRequired,
};

export default
  injectIntl(
    StoryFeedbackRow
  );
