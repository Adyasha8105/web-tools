import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import * as d3 from 'd3';
import composeHelpfulContainer from '../../../common/HelpfulContainer';
import VisualTimespanSelector from './VisualTimespanSelector';
import TimespanPeriodSelector from './TimespanPeriodSelector';

const localMessages = {
  timespansHelpTitle: { id: 'timespans.help.title', defaultMessage: 'About Timespans' },
  timespansHelpText: { id: 'timespans.help.text',
    defaultMessage: '<p>Timespans let you look at just the stories published within your topic during a certain timeframe.  We\'ve set up monthly and weekly Timesans for you, but you can also define your own while creating a new Snapshot.</p><p>Click "Show Timespans" to see your options.  The Timespan you are currently lokoing at is highlighted as a green box on the timeline. You\'ll see controls for flipping between the various Timespans in this Topic on the left.  When you see a Timespan you want to dig into, click the box on the visual timeline to switch into it.</p><p>You can return to look at the whole Topic by selecting the "overall" Timespan.</p>',
  },
  timespansHide: { id: 'timespans.hide', defaultMessage: 'Hide Timespans' },
  timespansShow: { id: 'timespans.show', defaultMessage: 'Show Timespans' },
};

function filterByPeriod(timespans, period) {
  return timespans.filter(t => t.period === period);
}

const TimespanSelector = (props) => {
  const { timespans, selectedTimespan, onTimespanSelected, onPeriodSelected,
    isExpanded, setExpanded, selectedPeriod, helpButton } = props;
  const oldestTimespanStart = d3.min(timespans.map(t => t.startDateObj));
  const latestTimespanEnd = d3.max(timespans.map(t => t.endDateObj));
  let expandControl = null;
  if (isExpanded) {
    // we have to set back the selected period to match the selectedTimespan's period when they collapse the UI
    expandControl = (<a href="#hide-timespans" className="greyed" onClick={(evt) => { evt.preventDefault(); onPeriodSelected(selectedTimespan.period); setExpanded(false); }}>
      <FormattedMessage {...localMessages.timespansHide} />
    </a>);
  } else {
    expandControl = (<a href="#show-timespans" className="greyed" onClick={(evt) => { evt.preventDefault(); setExpanded(true); }}>
      <FormattedMessage {...localMessages.timespansShow} />
    </a>);
  }
  let expandedContent = null;
  if (isExpanded) {
    expandedContent = (
      <Row>
        <Col lg={12}>
          <VisualTimespanSelector
            timespans={filterByPeriod(timespans, selectedPeriod)}
            startDate={oldestTimespanStart}
            endDate={latestTimespanEnd}
            onTimespanSelected={onTimespanSelected}
            selectedTimespan={selectedTimespan}
          />
        </Col>
      </Row>
    );
  }
  return (
    <div className="timespan-selector">
      <Grid>
        <Row>
          <Col lg={2} sm={2} xs={12}>
            <TimespanPeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodSelected={(period) => { onPeriodSelected(period); setExpanded(true); }}
            />
          </Col>
          <Col lg={8} sm={8} xs={12} className="center">
            {selectedTimespan.start_date.substr(0, 10)} to {selectedTimespan.end_date.substr(0, 10)}
          </Col>
          <Col lg={2} sm={2} xs={12} >
            <div className="toggle-control">
              {expandControl}
              {helpButton}
            </div>
          </Col>
        </Row>
        { expandedContent }
      </Grid>
    </div>
  );
};

TimespanSelector.propTypes = {
  // from parent
  timespans: React.PropTypes.array.isRequired,
  isExpanded: React.PropTypes.bool.isRequired,
  selectedPeriod: React.PropTypes.string.isRequired,
  selectedTimespan: React.PropTypes.object,
  onTimespanSelected: React.PropTypes.func.isRequired,
  onPeriodSelected: React.PropTypes.func.isRequired,
  setExpanded: React.PropTypes.func.isRequired,
  // from helpful
  helpButton: React.PropTypes.node.isRequired,
};

export default
  injectIntl(
    composeHelpfulContainer(localMessages.timespansHelpTitle, localMessages.timespansHelpText)(
      TimespanSelector
    )
  );
