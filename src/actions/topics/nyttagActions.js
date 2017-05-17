import { createAsyncAction } from '../../lib/reduxHelpers';
import * as api from '../../lib/serverApi/topics';

export const FETCH_TOPIC_NYT_TAG_COVERAGE = 'FETCH_TOPIC_NYT_TAG_COVERAGE';
export const FETCH_TOPIC_NYT_TAG_COUNTS = 'FETCH_TOPIC_NYT_TAG_COUNTS';

// pass in topic id, filters
export const fetchTopicNytLabelCoverage = createAsyncAction(FETCH_TOPIC_NYT_TAG_COVERAGE, api.topicNytTaggedStoryCoverage);

// pass in topic id, filters
export const fetchTopicNytLabelCounts = createAsyncAction(FETCH_TOPIC_NYT_TAG_COUNTS, api.topicNytTaggedStoryCounts);
