import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import composeAsyncContainer from '../../../../../common/AsyncContainer';
import { fetchCreateFocusRetweetCoverage } from '../../../../../../actions/topicActions';
import DataCard from '../../../../../common/DataCard';
import PieChart from '../../../../../vis/PieChart';
import { getBrandDarkColor } from '../../../../../../styles/colors';

const localMessages = {
  title: { id: 'topic.snapshot.retweet.coverage.title', defaultMessage: 'Story Coverage' },
  intro: { id: 'topic.snapshot.retweet.coverage.intro', defaultMessage: 'Our categorization of media sources by how much Trump and Clinton followers retweeted them in 2016 only covers the top 1000 sources from our 2016 US election topic.  This pie chart shows you how many stories form those media appear in this topic, versus how many don\'t.  If the coverage in this topic isn\'t high, you might not want to use this subtopic creation technique.' },
  included: { id: 'topic.snapshot.keywords.coverage.matching', defaultMessage: 'Stories with partisanship info' },
  notIncluded: { id: 'topic.snapshot.keywords.coverage.total', defaultMessage: 'Stories without partisanship info' },
};

const RetweetCoveragePreviewContainer = (props) => {
  const { counts } = props;
  const { formatMessage } = props.intl;
  let content = null;
  if (counts !== null) {
    content = (
      <PieChart
        title={formatMessage(localMessages.title)}
        data={[
          { name: formatMessage(localMessages.included), y: counts.count, color: getBrandDarkColor() },
          { name: formatMessage(localMessages.notIncluded), y: counts.total - counts.count, color: '#cccccc' },
        ]}
        height={250}
        showDataLabels={false}
      />
    );
  }
  return (
    <DataCard>
      <h2>
        <FormattedMessage {...localMessages.title} />
      </h2>
      <p><FormattedMessage {...localMessages.intro} /></p>
      {content}
    </DataCard>
  );
};

RetweetCoveragePreviewContainer.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  // from parent
  topicId: PropTypes.number.isRequired,
  // from dispatch
  asyncFetch: PropTypes.func.isRequired,
  // from state
  counts: PropTypes.object,
  fetchStatus: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.topics.selected.focalSets.create.retweetCoverage.fetchStatus,
  counts: state.topics.selected.focalSets.create.retweetCoverage.counts,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  asyncFetch: () => {
    dispatch(fetchCreateFocusRetweetCoverage(ownProps.topicId));
  },
});

export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(
      composeAsyncContainer(
        RetweetCoveragePreviewContainer
      )
    )
  );
