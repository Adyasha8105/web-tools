import PropTypes from 'prop-types';
import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import Menu from '@material-ui/core/Menu';
import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';
import MoreOptionsIcon from './icons/MoreOptionsIcon';
import CloseIcon from './icons/CloseIcon';
import { getBrandDarkColor, getBrandDarkerColor } from '../../styles/colors';
// import AppButton from './AppButton';

class ActionMenu extends React.Component {
  state = {
    backgroundColor: getBrandDarkColor(),
    isPopupOpen: false,
  };

  handlePopupOpenClick = (event) => {
    if (event) {
      this.handlePopupOpen(event);
    } else {
      this.handlePopupClose(event);
    }
  }
  handlePopupOpen = (event) => {
    event.preventDefault();
    this.setState({
      isPopupOpen: !this.state.isPopupOpen,
      anchorEl: event.currentTarget,
    });
  }
  handlePopupClose = () => {
    this.setState({
      isPopupOpen: !this.state.isPopupOpen,
    });
  }
  handleMouseEnter = () => {
    this.setState({ backgroundColor: getBrandDarkerColor() });
  }
  handleMouseLeave = () => {
    this.setState({ backgroundColor: getBrandDarkColor() });
  }

  render() {
    const { color, openButton, closeButton, children, actionTextMsg } = this.props;
    const { formatMessage } = this.props.intl;
    const otherProps = {};
    otherProps.backgroundColor = this.state.backgroundColor;
    let closeIconButton = (
      <IconButton style={{ padding: 0, margin: 0, width: 32, height: 32 }} >
        <CloseIcon color={color} {...otherProps} />
      </IconButton>
    );
    let openIconButton = (
      <IconButton style={{ padding: 0, margin: 0, width: 32, height: 32 }} >
        <MoreOptionsIcon color={color} {...otherProps} />
      </IconButton>
    );

    if (openButton) {
      openIconButton = open;
    }
    if (closeButton) {
      closeIconButton = close;
    }

    const icon = (this.state.isPopupOpen) ? closeIconButton : openIconButton;

    // support text or icon-driven menus
    let menuContent;
    if (actionTextMsg) {
      menuContent = (
        <span>
          <a className="text-trigger" role="button" href={`#${formatMessage(actionTextMsg)}`} onClick={this.handlePopupOpen}>
            <FormattedMessage {...actionTextMsg} />
          </a>
          <Popover
            open={this.state.isPopupOpen}
            anchorEl={this.state.anchorEl}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            targetOrigin={{ horizontal: 'right', vertical: 'top' }}
            onRequestClose={this.handlePopupClose}
          >
            {children}
          </Popover>
        </span>
      );
    } else {
      menuContent = (
        <Menu
          open={this.state.isPopupOpen}
          iconButtonElement={icon}
          onRequestChange={() => this.handlePopupOpenClick(event)}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          targetOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          {children}
        </Menu>
      );
    }

    return (
      <div className="action-icon-menu">
        {menuContent}
      </div>
    );
  }
}
ActionMenu.propTypes = {
  onClick: PropTypes.func,
  topLevelButton: PropTypes.func,
  children: PropTypes.array,
  openButton: PropTypes.object,
  closeButton: PropTypes.object,
  tooltip: PropTypes.string,
  intl: PropTypes.object.isRequired,
  color: PropTypes.string,
  iconStyle: PropTypes.object,
  actionTextMsg: PropTypes.object,
};

export default injectIntl(ActionMenu);
