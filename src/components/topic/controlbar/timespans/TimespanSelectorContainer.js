import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { replace, push } from 'react-router-redux';
import { fetchTopicTimespansList, filterByTimespan, toggleTimespanControls, setTimespanVisiblePeriod }
  from '../../../../actions/topicActions';
import withAsyncData from '../../../common/hocs/AsyncDataContainer';
import { filteredLocation } from '../../../util/location';
import TimespanSelector from './TimespanSelector';

const TimespanSelectorContainer = (props) => {
  const { timespans, selectedTimespan, setExpanded, handleTimespanSelected, handlePeriodSelected, isVisible, selectedPeriod } = props;
  let content = null;
  if ((timespans.length > 0) && (selectedTimespan !== null) && (selectedTimespan !== undefined)) {
    content = (
      <TimespanSelector
        timespans={timespans}
        isExpanded={isVisible}
        selectedPeriod={selectedPeriod}
        selectedTimespan={selectedTimespan}
        onTimespanSelected={handleTimespanSelected}
        onPeriodSelected={handlePeriodSelected}
        setExpanded={setExpanded}
      />
    );
  }
  return (
    <div className="timespan-selector-wrapper">
      {content}
    </div>
  );
};

TimespanSelectorContainer.propTypes = {
  // from parent
  topicId: PropTypes.number.isRequired,
  location: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  // from dispatch
  fetchData: PropTypes.func.isRequired,
  handleTimespanSelected: PropTypes.func.isRequired,
  setExpanded: PropTypes.func.isRequired,
  handlePeriodSelected: PropTypes.func.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  timespans: PropTypes.array.isRequired,
  isVisible: PropTypes.bool.isRequired,
  selectedPeriod: PropTypes.string.isRequired,
  snapshotId: PropTypes.number.isRequired,
  timespanId: PropTypes.number,
  selectedTimespan: PropTypes.object,
};

// helper to update the url and fire off event
function updateTimespan(dispatch, location, timespan, shouldPush) {
  const newLocation = filteredLocation(location,
    { snapshotId: timespan.snapshots_id, focusId: timespan.foci_id, timespanId: timespan.timespans_id });
  // console.log('updateTimestamp');
  // console.log(newLocation);
  dispatch(filterByTimespan(timespan.timespans_id));
  if (shouldPush) {
    // add to history
    dispatch(push(newLocation));
  } else {
    // do a replace, not a push here so the non-snapshot url isn't in the history
    dispatch(replace(newLocation));
  }
}

const mapStateToProps = state => ({
  fetchStatus: state.topics.selected.timespans.fetchStatus,
  timespans: state.topics.selected.timespans.list,
  timespanId: state.topics.selected.filters.timespanId,
  snapshotId: state.topics.selected.filters.snapshotId,
  isVisible: state.topics.selected.timespans.isVisible,
  selectedPeriod: state.topics.selected.timespans.selectedPeriod,
  selectedTimespan: state.topics.selected.timespans.selected,
});

// when you switch snapshots we need to find the matching timespan in the new snapshot
function findMatchingTimespan(timespan, timespanList) {
  return timespanList.list.find(ts => (
    ((ts.period === timespan.period) && (ts.start_date === timespan.start_date) && (ts.end_date === timespan.end_date))
  ));
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  handlePeriodSelected: (period, firstTimespanInPeriod) => {
    dispatch(setTimespanVisiblePeriod(period));
    updateTimespan(dispatch, ownProps.location, firstTimespanInPeriod, true);
  },
  setExpanded: (isExpanded) => {
    dispatch(toggleTimespanControls(isExpanded));
  },
  handleTimespanSelected: (timespan) => {
    updateTimespan(dispatch, ownProps.location, timespan, true);
  },
});

const fetchAsyncData = (dispatch, { topicId, snapshotId, focusId, timespanId, selectedTimespan, location }) => {
  const cleanedFocus = Number.isNaN(focusId) ? null : focusId;
  dispatch(fetchTopicTimespansList(topicId, snapshotId, { focusId: cleanedFocus }))
    .then((response) => {
      let pickDefault = false;
      if (timespanId === null || Number.isNaN(timespanId)) {
        // no timespan selected so we'll default to one
        pickDefault = true;
      } else if ((selectedTimespan !== null) && (selectedTimespan.foci_id !== cleanedFocus)) {
        // if the snapshot has switched, we need to figure out what the corresponding timespan is
        const matchingNewTimespan = findMatchingTimespan(selectedTimespan, response.list);
        if (matchingNewTimespan !== undefined) {
          updateTimespan(dispatch, location, matchingNewTimespan, false);
        } else {
          pickDefault = true;
        }
      } else {
        // first load - match sure selected timespan period matches the selected timespan
        const matchingTimespan = response.list.find(ts => ts.timespans_id === timespanId);
        dispatch(setTimespanVisiblePeriod(matchingTimespan.period));
      }
      if (pickDefault) {
        const defaultTimespan = response.list[0]; // pick the first timespan as the default (this is the overall one)
        // console.log('pick default');
        // console.log(defaultTimespan);
        updateTimespan(dispatch, location, defaultTimespan, false);
      }
    });
};

export default
connect(mapStateToProps, mapDispatchToProps)(
  withAsyncData(fetchAsyncData, ['snapshotId', 'timespanId', 'focusId'])(
    TimespanSelectorContainer
  )
);
