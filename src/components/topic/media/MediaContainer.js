import PropTypes from 'prop-types';
import React from 'react';
import Title from 'react-title-component';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import { selectMedia, fetchMedia } from '../../../actions/topicActions';
import composeAsyncContainer from '../../common/AsyncContainer';
import MediaInlinkContainer from './MediaInlinkContainer';
import MediaOutlinkContainer from './MediaOutlinkContainer';
import MediaStoriesContainer from './MediaStoriesContainer';
import MediaSentenceCountContainer from './MediaSentenceCountContainer';
import MediaWordsContainer from './MediaWordsContainer';
import messages from '../../../resources/messages';
import { RemoveButton, ReadItNowButton } from '../../common/IconButton';
import ComingSoon from '../../common/ComingSoon';
import MediaSourceIcon from '../../common/icons/MediaSourceIcon';
import Permissioned from '../../common/Permissioned';
import { PERMISSION_TOPIC_WRITE } from '../../../lib/auth';
import StatBar from '../../common/statbar/StatBar';
import CollectionList from '../../common/CollectionList';
import SourceMetadataStatBar from '../../common/SourceMetadataStatBar';

const localMessages = {
  removeTitle: { id: 'story.details.remove', defaultMessage: 'Remove from Next Snapshot' },
  removeAbout: { id: 'story.details.remove.about', defaultMessage: 'If media source is clearly not related to the Topic, or is messing up your analysis, you can remove it from the next Snapshot.  Be careful, because this means it won\'t show up anywhere on the new Snapshot you generate.' },
  storyCount: { id: 'media.details.storyCount', defaultMessage: 'Stories in timespan' },
  collectionTitle: { id: 'media.details.collections.title', defaultMessage: 'Collections' },
  collectionIntro: { id: 'media.details.collections.info', defaultMessage: 'This source is in the following collections.' },
};

class MediaContainer extends React.Component {

  state = {
    open: false,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.mediaId !== this.props.mediaId) {
      const { fetchData } = this.props;
      fetchData(nextProps.mediaId);
    }
  }

  handleRemoveClick = () => {
    this.setState({ open: true });
  };

  handleRemoveDialogClose = () => {
    this.setState({ open: false });
  };

  handleReadItClick = () => {
    const { media } = this.props;
    window.open(media.url, '_blank');
  }

  render() {
    const { media, topicId, mediaId, filters, topicName } = this.props;
    const { formatMessage, formatNumber } = this.props.intl;
    const titleHandler = parentTitle => `${media.name} | ${parentTitle}`;
    const dialogActions = [
      <FlatButton
        label={formatMessage(messages.ok)}
        primary
        onClick={this.handleRemoveDialogClose}
      />,
    ];
    let summaryStats;
    if (filters.q) {
      // say "unknown" here because we can't query for this with a filter query in place :-(
      summaryStats = [
        { message: messages.mediaInlinks, data: formatMessage(messages.unknown) },
        { message: messages.inlinks, data: formatMessage(messages.unknown) },
        { message: messages.outlinks, data: formatMessage(messages.unknown) },
        { message: messages.facebookShares, data: formatMessage(messages.unknown) },
        { message: localMessages.storyCount, data: formatMessage(messages.unknown) },
      ];
    } else {
      summaryStats = [
        { message: messages.mediaInlinks, data: formatNumber(media.media_inlink_count) },
        { message: messages.inlinks, data: formatNumber(media.inlink_count) },
        { message: messages.outlinks, data: formatNumber(media.outlink_count) },
        { message: messages.facebookShares, data: formatNumber(media.facebook_share_count) },
        { message: localMessages.storyCount, data: formatNumber(media.story_count) },
      ];
    }
    return (
      <div>
        <Title render={titleHandler} />
        <Grid>
          <Row>
            <Col lg={12} md={12} sm={12}>
              <h1>
                <span className="actions">
                  <ReadItNowButton onClick={this.handleReadItClick} />
                  <Permissioned onlyTopic={PERMISSION_TOPIC_WRITE}>
                    <RemoveButton tooltip={formatMessage(localMessages.removeTitle)} onClick={this.handleRemoveClick} />
                  </Permissioned>
                </span>
                <MediaSourceIcon height={32} />
                {media.name}
              </h1>
            </Col>
          </Row>
          <Dialog
            className="app-dialog"
            title={formatMessage(localMessages.removeTitle)}
            actions={dialogActions}
            modal={false}
            open={this.state.open}
            onRequestClose={this.handleRemoveDialogClose}
          >
            <p><FormattedMessage {...localMessages.removeAbout} /></p>
            <ComingSoon />
          </Dialog>
          <Row>
            <Col lg={6} md={6} sm={12}>
              <StatBar
                stats={summaryStats}
              />
            </Col>
            <Col lg={6} md={6} sm={12}>
              <MediaSentenceCountContainer topicId={topicId} mediaId={mediaId} />
            </Col>
          </Row>
          <Row>
            <Col lg={12} md={12} sm={12}>
              <MediaStoriesContainer topicId={topicId} mediaId={mediaId} />
            </Col>
          </Row>
          <Row>
            <Col lg={12} md={12} sm={12}>
              <MediaInlinkContainer topicId={topicId} mediaId={mediaId} />
            </Col>
          </Row>
          <Row>
            <Col lg={12} md={12} sm={12}>
              <MediaOutlinkContainer topicId={topicId} mediaId={mediaId} />
            </Col>
          </Row>
          <Row>
            <Col lg={6} md={6} sm={12}>
              <MediaWordsContainer topicId={topicId} mediaId={mediaId} topicName={topicName} />
            </Col>
            <Col lg={6} xs={12}>
              <CollectionList
                title={formatMessage(localMessages.collectionTitle)}
                intro={formatMessage(localMessages.collectionIntro)}
                collections={media.media_source_tags}
                linkToFullUrl
              />
            </Col>
          </Row>
          <Row>
            <Col lg={12}>
              <SourceMetadataStatBar source={media} />
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }

}

MediaContainer.propTypes = {
  // from context
  params: PropTypes.object.isRequired,       // params from router
  intl: PropTypes.object.isRequired,
  // from parent
  // from dispatch
  asyncFetch: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  // from state
  filters: PropTypes.object.isRequired,
  media: PropTypes.object.isRequired,
  mediaId: PropTypes.number.isRequired,
  topicId: PropTypes.number.isRequired,
  topicName: PropTypes.string.isRequired,
  fetchStatus: PropTypes.string.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
  filters: state.topics.selected.filters,
  fetchStatus: state.topics.selected.mediaSource.info.fetchStatus,
  mediaId: parseInt(ownProps.params.mediaId, 10),
  topicId: state.topics.selected.id,
  topicName: state.topics.selected.info.name,
  media: state.topics.selected.mediaSource.info,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  asyncFetch: () => {
    dispatch(selectMedia(ownProps.params.mediaId));    // save it to the state
    dispatch(fetchMedia(ownProps.params.topicId, ownProps.params.mediaId)); // fetch the info we need
  },
  fetchData: (mediaId) => {
    dispatch(selectMedia(mediaId));    // save it to the state
    dispatch(fetchMedia(mediaId)); // fetch the info we need
  },
});

export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(
      composeAsyncContainer(
        MediaContainer
      )
    )
  );
