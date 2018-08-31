import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import ColorPicker from '../../common/ColorPicker';
import { QUERY_LABEL_CHARACTER_LIMIT, ACTION_MENU_ITEM_CLASS } from '../../../lib/explorerUtil';
import { defaultMenuOriginProps } from '../../util/uiUtil';

const localMessages = {
  title: { id: 'explorer.querypicker.title', defaultMessage: 'Rename Query' },
  delete: { id: 'explorer.querypicker.delete', defaultMessage: 'Delete Query' },
};

class QueryPickerLoggedInHeader extends React.Component {
  state = {
    anchorEl: null,
  };

  handleClick = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  render() {
    const { query, isDeletable, onColorChange, onDelete, onLabelEditRequest } = this.props;
    let nameInfo = <div />;
    let menuChildren = null;
    let iconOptions = null;
    if (isDeletable()) { // if this is not the only QueryPickerItem
      menuChildren = (
        <div>
          <MenuItem className={ACTION_MENU_ITEM_CLASS} onClick={() => { onLabelEditRequest(); this.handleClose(); }}><FormattedMessage {...localMessages.title} /></MenuItem>
          <MenuItem className={ACTION_MENU_ITEM_CLASS} onClick={() => { onDelete(query); this.handleClose(); }}><FormattedMessage {...localMessages.delete} /></MenuItem>
        </div>
      );
    } else {
      menuChildren = (
        <div>
          <MenuItem className={ACTION_MENU_ITEM_CLASS} onClick={() => { onLabelEditRequest(); this.handleClose(); }}><FormattedMessage {...localMessages.title} /></MenuItem>
        </div>
      );
    }
    if (menuChildren !== null) {
      iconOptions = (
        <div className="query-picker-icon-button">
          <IconButton onClick={this.handleClick} aria-haspopup="true" aria-owns="logged-in-header-menu"><MoreVertIcon /></IconButton>
          <Menu
            id="logged-in-header-menu"
            open={Boolean(this.state.anchorEl)}
            className="query-picker-icon-button"
            {...defaultMenuOriginProps}
            anchorEl={this.state.anchorEl}
            onBackdropClick={this.handleClose}
            onClose={this.handleClose}
          >
            {menuChildren}
            <MenuItem className="color-picker-menu-item">
              <ColorPicker
                name="color"
                color={query.color}
                onChange={(e) => { onColorChange(e.value); this.handleClose(); }}
                showLabel
              />
            </MenuItem>
          </Menu>
        </div>
      );
      let abbrevQuery = query.label;
      if (abbrevQuery.length > QUERY_LABEL_CHARACTER_LIMIT) {
        abbrevQuery = abbrevQuery.slice(0, QUERY_LABEL_CHARACTER_LIMIT).concat('...');
      }
      if (query) {
        nameInfo = (
          <div>
            <ColorPicker
              color={query.color}
              onChange={(e) => { onColorChange(e.value); this.handleClose(); }}
            />&nbsp;
            <span
              className="query-picker-name"
            >
              {abbrevQuery}
            </span>
            {iconOptions}
          </div>
        );
      }
    }
    return nameInfo;
  }
}

QueryPickerLoggedInHeader.propTypes = {
  // from parent
  query: PropTypes.object,
  isDeletable: PropTypes.func.isRequired,
  onColorChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onLabelEditRequest: PropTypes.func,
  // from composition
  intl: PropTypes.object.isRequired,
};


export default
  injectIntl(
    QueryPickerLoggedInHeader
  );
