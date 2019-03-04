import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import withAsyncData from '../../../common/hocs/AsyncDataContainer';
import AttentionOverTimeChart from '../../../vis/AttentionOverTimeChart';
import { fetchAttentionByQuery } from '../../../../actions/topicActions';
import withDescription from '../../../common/hocs/DescribedDataCard';
import DataCard from '../../../common/DataCard';
import { getBrandDarkColor } from '../../../../styles/colors';

const localMessages = {
  title: { id: 'topic.create.preview.attention.title', defaultMessage: 'Matching Stories' },
  descriptionIntro: { id: 'topic.summary.splitStoryCount.help.title', defaultMessage: 'The attention over time to your topic can vary. If you see a predominantly flat line here with no attention, consider going back and changing the start and end dates for your topic. If you have too many total seed stories, try shortening the total number of days your topic covers.' },
  helpText: { id: 'media.splitStoryCount.help.text',
    defaultMessage: '<p>This chart shows you the number of stories over time that match your topic query. This a good preview of the attention paid to your topic that we already have in our system.</p>',
  },
};

const TopicAttentionPreview = (props) => {
  const { total, counts, query } = props;
  return (
    <DataCard>
      <h2>
        <FormattedMessage {...localMessages.title} />
      </h2>
      <AttentionOverTimeChart
        lineColor={getBrandDarkColor()}
        total={total}
        series={[{
          id: 0,
          name: query.name,
          color: getBrandDarkColor(),
          data: counts.map(c => [c.date, c.count]),
          showInLegend: false,
        }]}
        height={250}
      />
    </DataCard>
  );
};

TopicAttentionPreview.propTypes = {
  // from composition chain
  intl: PropTypes.object.isRequired,
  // passed in
  query: PropTypes.object.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  total: PropTypes.number,
  counts: PropTypes.array,
};

const mapStateToProps = state => ({
  fetchStatus: state.topics.modify.preview.matchingAttention.fetchStatus,
  total: state.topics.modify.preview.matchingAttention.total,
  counts: state.topics.modify.preview.matchingAttention.counts,
});

const fetchAsyncData = (dispatch, { query }) => {
  const infoForQuery = {
    q: query.solr_seed_query,
    start_date: query.start_date,
    end_date: query.end_date,
  };
  infoForQuery['collections[]'] = [];
  infoForQuery['sources[]'] = [];

  if ('sourcesAndCollections' in query) { // in FieldArrays on the form
    infoForQuery['collections[]'] = query.sourcesAndCollections.map(s => s.tags_id);
    infoForQuery['sources[]'] = query.sourcesAndCollections.map(s => s.media_id);
  }
  dispatch(fetchAttentionByQuery(infoForQuery));
};

export default
injectIntl(
  connect(mapStateToProps)(
    withDescription(localMessages.descriptionIntro, localMessages.helpText)(
      withAsyncData(fetchAsyncData, ['query'])(
        TopicAttentionPreview
      )
    )
  )
);
