import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { selectMediaPickerQueryArgs, selectMedia } from '../../../actions/systemActions';
import { PICK_COLLECTION, PICK_SOURCE, PICK_COUNTRY } from '../../../lib/explorerUtil';
import SourceOrCollectionWidget from '../SourceOrCollectionWidget';
// import SelectedMediaContainer from './SelectedMediaContainer';

const localMessages = {
  pickCountry: { id: 'system.mediaPicker.select.pickCountry', defaultMessage: 'Search By Country' },
  pickCollections: { id: 'system.mediaPicker.select.pickCollections', defaultMessage: 'Search Collections' },
  pickSources: { id: 'system.mediaPicker.select.pickSources', defaultMessage: 'Search Sources' },
  selectedMedia: { id: 'system.mediaPicker.selected.title', defaultMessage: 'Selected Media' },
  // pickAdvanced: { id: 'system.mediaPicker.select.pickAdvanced', defaultMessage: 'Advanced Selection' },
  // pickStarred: { id: 'system.mediaPicker.select.pickStarred', defaultMessage: 'Pick From Starred' },
};

class PickedMediaContainer extends React.Component {

  updateMediaType = (type) => {
    const { updateMediaSelection } = this.props;
    updateMediaSelection(type);
  };
  render() {
    const { selectedMediaQueryType, selectedMedia, handleUnselectMedia } = this.props;
    const selectedMediaList =
      selectedMedia.map(obj => (
        <SourceOrCollectionWidget
          key={obj.id || obj.tags_id || obj.media_id}
          object={obj}
          onDelete={() => handleUnselectMedia(obj)}
        />
      ));
    const options = [
      { label: localMessages.pickCountry, value: PICK_COUNTRY },
      { label: localMessages.pickCollections, value: PICK_COLLECTION },
      { label: localMessages.pickSources, value: PICK_SOURCE },
    ];
    return (
      <div>
        <div className="select-media-menu">
          {options.map((option, idx) => (
            <div
              key={idx}
              className={`select-media-option ${(selectedMediaQueryType === option.value) ? 'selected' : ''}`}
              onTouchTap={() => this.updateMediaType(option.value)}
            >
              <h3><FormattedMessage {...option.label} /></h3>
            </div>
          ))}
        </div>
        <div className="select-media-selected-list">
          <h3><FormattedMessage {...localMessages.selectedMedia} /></h3>
          {selectedMediaList}
        </div>
      </div>
    );
  }
}

PickedMediaContainer.propTypes = {
  // from context
  intl: PropTypes.object.isRequired,
  // from parent
  selectedMedia: PropTypes.array,
  selectedMediaQueryType: PropTypes.number,
  updateMediaSelection: PropTypes.func.isRequired,
  handleUnselectMedia: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  selectedMediaQueryType: state.system.mediaPicker.selectMediaQuery ? state.system.mediaPicker.selectMediaQuery.args.type : 0,
  sourcesResults: state.system.mediaPicker.media ? state.system.mediaPicker.media.results : null, // resutl of query?
  collectionsResults: state.system.mediaPicker.collections ? state.system.mediaPicker.collections.results : null,
});

const mapDispatchToProps = dispatch => ({
  updateMediaSelection: (type) => {
    if (type >= 0) {
      dispatch(selectMediaPickerQueryArgs({ type }));
    }
  },
  handleUnselectMedia: (selectedMedia) => {
    if (selectedMedia) {
      const unselectecMedia = Object.assign({}, selectedMedia, { selected: false });
      dispatch(selectMedia(unselectecMedia)); // disable MediaPickerPreviewList button too
    }
  },
});


export default
  injectIntl(
    connect(mapStateToProps, mapDispatchToProps)(
      PickedMediaContainer
    )
  );
