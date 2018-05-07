import PropTypes from 'prop-types';
import React from 'react';
import Title from 'react-title-component';
import { connect } from 'react-redux';
import Link from 'react-router/lib/Link';
import { FormattedMessage, injectIntl, FormattedHTMLMessage } from 'react-intl';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import TopicSearchContainer from '../search/TopicSearchContainer';
import TopicListContainer from '../list/TopicListContainer';
import LoginForm from '../../user/LoginForm';
import TopicIcon from '../../common/icons/TopicIcon';
import PublicTopicsContainer from '../list/PublicTopicsContainer';
import DataCard from '../../common/DataCard';
import { AddButton } from '../../common/IconButton';
import messages from '../../../resources/messages';
import Masthead from '../../common/header/Masthead';
import TopicsMarketingFeatureList from './TopicsMarketingFeatureList';

const localMessages = {
  homeTitle: { id: 'home.title', defaultMessage: 'Home' },
  title: { id: 'home.intro', defaultMessage: 'Create a Topic to Dive In Deep' },
  about: { id: 'home.intro', defaultMessage: '<p>Use Topic Mapper to dive in deeper on an issue you are investigating.  Once you\'ve used <a href="https://explorer.mediacloud.org">the Explorer</a> to narrow in on a query, media sources, and time period you want to investigate, then you can create a Topic to collect more stories, analyze influence, and slice and dice the content.  This lets you research the media conversation about your topic with more rigor.</p>' },
  publicHomeTitle: { id: 'home.title', defaultMessage: 'Explore Public Topics' },
  loginTitle: { id: 'sources.intro.login.title', defaultMessage: 'Have an Account? Login Now' },
};

const TopicsHomepage = (props) => {
  const { user } = props;
  const { formatMessage } = props.intl;
  const title = formatMessage(localMessages.homeTitle);
  const titleHandler = parentTitle => `${title} | ${parentTitle}`;
  let content = null;
  const mastHead = (
    <Masthead
      nameMsg={messages.topicsToolName}
      descriptionMsg={messages.topicsToolDescription}
      link="https://mediacloud.org/tools/"
    />
  );
  if (user.isLoggedIn) {
    content = (
      <div>

        <Title render={titleHandler} />

        <div className="controlbar">
          <div className="main">
            <Grid>
              <Row>
                <Col lg={8} className="left">
                  <Link to="topics/create">
                    <AddButton />
                    <FormattedMessage {...messages.createNewTopic} />
                  </Link>
                </Col>
                <Col lg={4}>
                  <TopicSearchContainer />
                </Col>
              </Row>
            </Grid>
          </div>
        </div>

        <Grid>
          <TopicListContainer />
        </Grid>

        <TopicsMarketingFeatureList />

      </div>
    );
  } else {
    content = (
      <div>

        <Title render={titleHandler} />

        <Grid>
          <Row>
            <Col lg={1} xs={0} />
            <Col lg={5} xs={12}>
              <h1><TopicIcon height={32} /><FormattedMessage {...localMessages.title} /></h1>
              <p><FormattedHTMLMessage {...localMessages.about} /></p>
            </Col>
            <Col lg={1} xs={0} />
            <Col lg={5} xs={12}>
              <DataCard>
                <h2><FormattedMessage {...localMessages.loginTitle} /></h2>
                <LoginForm redirect="/home" />
              </DataCard>
            </Col>
          </Row>
        </Grid>

        <TopicsMarketingFeatureList />

        <Grid>
          <Row>
            <Col lg={12}>
              <h1><FormattedMessage {...localMessages.publicHomeTitle} /></h1>
              <PublicTopicsContainer />
            </Col>
          </Row>
        </Grid>

      </div>
    );
  }
  return (
    <div className="homepage">
      {mastHead}
      {content}
    </div>
  );
};

TopicsHomepage.propTypes = {
  // from context
  intl: PropTypes.object.isRequired,
  // from state
  user: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  userTopicPermission: state.topics.selected.info.user_permission,
  user: state.user,
});

export default
  injectIntl(
    connect(mapStateToProps)(
      TopicsHomepage
    )
  );
