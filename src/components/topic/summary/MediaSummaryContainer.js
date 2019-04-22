import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ActionMenu from '../../common/ActionMenu';
import withCsvDownloadNotifyContainer from '../../common/hocs/CsvDownloadNotifyContainer';
import withFilteredAsyncData from '../FilteredAsyncDataContainer';
import withSummary from '../../common/hocs/SummarizedVizualization';
import MediaTable from '../MediaTable';
import messages from '../../../resources/messages';
import { fetchTopicTopMedia, sortTopicTopMedia } from '../../../actions/topicActions';
import Permissioned from '../../common/Permissioned';
import { getUserRoles, hasPermissions, PERMISSION_LOGGED_IN } from '../../../lib/auth';
import { DownloadButton } from '../../common/IconButton';
import { filteredLinkTo, filtersAsUrlParams } from '../../util/location';
import { HELP_SOURCES_CSV_COLUMNS } from '../../../lib/helpConstants';

const localMessages = {
  title: { id: 'topic.summary.topMedia.title', defaultMessage: 'Top Media' },
  descriptionIntro: { id: 'topic.summary.stories.help.title', defaultMessage: '<p>The top media sources within this topic can show which sources had control of the main narratives. Sort by different measures to get a better picture of a media source\'s influence.</p>' },
  description: { id: 'topic.summary.topMedia.help.text',
    defaultMessage: '<p>This table shows you the media that wrote about this Topic the most.</p><p>This table has one row for each Media Source.  The column currently being used to sort the results has a little down arrow next to it.  Click one of the green column headers to change how it is sorted.  Here is a summary of the columns:</p><ul><li>Name: the name of the Media Source; click to see details about this source\'s content within this Topic</li><li>Media Inlinks: how many unique other Media Sources have links to this content from this Media Source in the Topic</li><li>Outlinks: the number of links in this Media Source to other stories</li><li>Facebook Shares: the number of times stories from this Media Source were shared on Facebook</li></ul><p>Click the download button in the top right to download a CSV of the full list of stories</p>',
  },
  downloadCSV: { id: 'topic.summary.topMedia.downloadCSV', defaultMessage: 'Download CSV Of All Media' },
  downloadLinkCsv: { id: 'topic.summary.topMedia.downloadLinkCsv', defaultMessage: 'Download CSV Of All Media Links' },
};

const NUM_TO_SHOW = 10;

class MediaSummaryContainer extends React.Component {
  onChangeSort = (newSort) => {
    const { sortData } = this.props;
    sortData(newSort);
  }

  downloadCsv = () => {
    const { topicId, filters, sort, notifyOfCsvDownload } = this.props;
    const url = `/api/topics/${topicId}/media.csv?${filtersAsUrlParams(filters)}&sort=${sort}`;
    window.location = url;
    notifyOfCsvDownload(HELP_SOURCES_CSV_COLUMNS);
  }

  downloadLinkCsv = () => {
    const { topicId, filters, sort } = this.props;
    const url = `/api/topics/${topicId}/media/media-links.csv?${filtersAsUrlParams(filters)}&sort=${sort}`;
    window.location = url;
  }

  render() {
    const { media, sort, topicId, user } = this.props;
    const isLoggedIn = hasPermissions(getUserRoles(user), PERMISSION_LOGGED_IN);
    return (
      <React.Fragment>
        <MediaTable
          media={media}
          onChangeSort={isLoggedIn ? this.onChangeSort : null}
          sortedBy={sort}
          topicId={topicId}
          showMetadata
          showTweetCounts
        />
        <Permissioned onlyRole={PERMISSION_LOGGED_IN}>
          <ActionMenu actionTextMsg={messages.downloadOptions}>
            <MenuItem
              className="action-icon-menu-item"
              onClick={this.downloadCsv}
            >
              <ListItemText><FormattedMessage {...localMessages.downloadCSV} /></ListItemText>
              <ListItemIcon><DownloadButton /></ListItemIcon>
            </MenuItem>
            <MenuItem
              className="action-icon-menu-item"
              onClick={this.downloadLinkCsv}
            >
              <ListItemText><FormattedMessage {...localMessages.downloadLinkCsv} /></ListItemText>
              <ListItemIcon><DownloadButton /></ListItemIcon>
            </MenuItem>
          </ActionMenu>
        </Permissioned>
      </React.Fragment>
    );
  }
}

MediaSummaryContainer.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  notifyOfCsvDownload: PropTypes.func.isRequired,
  // from parent
  topicId: PropTypes.number.isRequired,
  filters: PropTypes.object.isRequired,
  // from dispatch
  sortData: PropTypes.func.isRequired,
  handleExplore: PropTypes.func.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  sort: PropTypes.string.isRequired,
  media: PropTypes.array,
  user: PropTypes.object,
  showTweetCounts: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.topics.selected.summary.topMedia.fetchStatus,
  sort: state.topics.selected.summary.topMedia.sort,
  media: state.topics.selected.summary.topMedia.media,
  user: state.user,
  showTweetCounts: Boolean(state.topics.selected.info.ch_monitor_id),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  sortData: (sort) => {
    dispatch(sortTopicTopMedia(sort));
  },
  handleExplore: () => {
    const exploreUrl = filteredLinkTo(`/topics/${ownProps.topicId}/media`, ownProps.filters);
    dispatch(push(exploreUrl));
  },
});

const fetchAsyncData = (dispatch, props) => {
  const params = {
    ...props.filters,
    sort: props.sort,
    limit: NUM_TO_SHOW,
  };
  dispatch(fetchTopicTopMedia(props.topicId, params));
};

export default
injectIntl(
  connect(mapStateToProps, mapDispatchToProps)(
    withSummary(localMessages.title, localMessages.descriptionIntro, localMessages.description, true)(
      withCsvDownloadNotifyContainer(
        withFilteredAsyncData(fetchAsyncData, ['sort'])( // refetch data if sort property has changed
          MediaSummaryContainer
        ),
      )
    )
  )
);
