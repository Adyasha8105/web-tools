import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, FormattedDate, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Row, Col } from 'react-flexbox-grid/lib';
import { fetchSourceFeedRecentStories } from '../../../actions/sourceActions';
import withAsyncData from '../../common/hocs/AsyncDataContainer';
import StoryTable from '../../common/StoryTable';
import DataCard from '../../common/DataCard';
import { parseSolrShortDate } from '../../../lib/dateUtil';

const localMessages = {
  title: { id: 'source.feeds.recentStories', defaultMessage: 'Recent Stories' },
  collectedDate: { id: 'story.collectedDate', defaultMessage: 'Collection Date' },
  fullTextRss: { id: 'story.fullTextRss', defaultMessage: 'Full Text in RSS?' },
};

const FeedRecentStoriesContainer = ({ stories }) => (
  <Row className="feed-recent-stories">
    <Col lg={12}>
      <DataCard>
        <h2><FormattedMessage {...localMessages.title} /></h2>
        <StoryTable
          stories={stories}
          extraHeaderColumns={(
            <>
              <th><FormattedMessage {...localMessages.collectedDate} /></th>
              <th><FormattedMessage {...localMessages.fullTextRss} /></th>
            </>
          )}
          extraColumns={story => (
            <>
              <td className="numeric"><FormattedDate value={parseSolrShortDate(story.collect_date)} /></td>
              <td className="numeric">{story.full_text_rss}</td>
            </>
          )}
        />
      </DataCard>
    </Col>
  </Row>
);

FeedRecentStoriesContainer.propTypes = {
  // from parent
  feedId: PropTypes.number.isRequired,
  // from context
  intl: PropTypes.object.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  stories: PropTypes.array.isRequired,
};

const mapStateToProps = state => ({
  stories: state.sources.sources.selected.feed.stories.list,
  fetchStatus: state.sources.sources.selected.feed.stories.fetchStatus,
});

const fetchAsyncData = (dispatch, { feedId }) => dispatch(fetchSourceFeedRecentStories(feedId));

export default
injectIntl(
  connect(mapStateToProps)(
    withAsyncData(fetchAsyncData, ['feedId'])(
      FeedRecentStoriesContainer
    )
  )
);
