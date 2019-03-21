import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import withDescription from '../../../common/hocs/DescribedDataCard';
import withAsyncData from '../../../common/hocs/AsyncDataContainer';
import StoryTable from '../../../common/StoryTable'; // use this istead of TopicStoryTable because here we don't have extra metadata
import { fetchStorySampleByQuery } from '../../../../actions/topicActions';
import DataCard from '../../../common/DataCard';

const NUM_TO_SHOW = 20;

// TODO check all these messages

const localMessages = {
  title: { id: 'topic.create.preview.stories.title', defaultMessage: 'Story Samples' },
  helpTitle: { id: 'topic.create.preview.stories.help.title', defaultMessage: 'About Story Samples' },
  helpText: { id: 'topic.create.preview.stories.help.text',
    defaultMessage: '<p>This chart shows you estimated coverage of your seed query</p>',
  },
  descriptionIntro: { id: 'topic.summary.stories.help.title', defaultMessage: 'This is a random sample of stories. We recommend that at least 90% of the stories you see here should be the type of story you desire. Any less than that and you are unlikely to get good results. If not enough stories match, consider adding more of the top words shown above to narrow in on the stuff you care about.' },

};

const TopicStorySamplePreview = (props) => {
  const { stories } = props;
  return (
    <DataCard>
      <h2>
        <FormattedMessage {...localMessages.title} />
      </h2>
      <StoryTable
        stories={stories}
        maxTitleLength={50}
      />
    </DataCard>
  );
};

TopicStorySamplePreview.propTypes = {
  // from composition chain
  intl: PropTypes.object.isRequired,
  // passed in
  query: PropTypes.object.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  total: PropTypes.number,
  stories: PropTypes.array,
  // from dispath
  fetchData: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.topics.modify.preview.matchingStories.fetchStatus,
  sort: state.topics.modify.preview.matchingStories.total,
  stories: state.topics.modify.preview.matchingStories.list,
});

const fetchAsyncData = (dispatch, { query }) => {
  const infoForQuery = {
    q: query.solr_seed_query,
    start_date: query.start_date,
    end_date: query.end_date,
    limit: NUM_TO_SHOW,
  };
  infoForQuery['collections[]'] = [];
  infoForQuery['sources[]'] = [];

  if ('sourcesAndCollections' in query) { // in FieldArrays on the form
    infoForQuery['collections[]'] = query.sourcesAndCollections.map(s => s.tags_id);
    infoForQuery['sources[]'] = query.sourcesAndCollections.map(s => s.media_id);
  }
  dispatch(fetchStorySampleByQuery(infoForQuery));
};

export default
injectIntl(
  connect(mapStateToProps)(
    withDescription(localMessages.descriptionIntro)(
      withAsyncData(fetchAsyncData, ['query'])(
        TopicStorySamplePreview
      )
    )
  )
);
