import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import messages from '../../resources/messages';

const EntitiesTable = (props) => {
  const { entities, onClick } = props;
  const { formatNumber } = props.intl;
  const content = null;
  if (entities === undefined) {
    return (
      <div className="entity-table">
        { content }
      </div>
    );
  }
  return (
    <div className="entity-table">
      <table width="100%">
        <tbody>
          <tr>
            <th><FormattedMessage {...messages.entityName} /></th>
            <th className="numeric"><FormattedMessage {...messages.entityPercentage} /></th>
          </tr>
          {entities.map((entity, idx) =>
            (<tr key={entity.tags_id} className={(idx % 2 === 0) ? 'even' : 'odd'}>
              <td>
                <a
                  className="summary-entity"
                  tabIndex="0"
                  role="button"
                  onClick={() => onClick(entity.tags_id)}
                  onKeyPress={evt => evt.preventDefault()}
                >{entity.label}
                </a>
              </td>
              <td className="numeric">
                { formatNumber(entity.pct, { style: 'percent', maximumFractionDigits: 2 }) }
              </td>
            </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

EntitiesTable.propTypes = {
  entities: PropTypes.array,
  intl: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default injectIntl(EntitiesTable);
