from operator import itemgetter

from server import mc, TOOL_API_KEY
from server.views import TAG_COUNT_UI_LENGTH
from server.cache import cache, key_generator
from server.auth import user_mediacloud_client, user_mediacloud_key, is_user_logged_in, user_admin_mediacloud_client
from server.util.tags import processed_by_cliff_query_clause
import server.util.wordembeddings as wordembeddings


def normalized_and_story_split_count(mc_api_key, q, fq, open_q):
    results = {}
    counts = []
    data = cached_story_split_count(mc_api_key, q, fq)
    all_stories = cached_story_split_count(mc_api_key, open_q, fq)
    for day in all_stories['counts']:
        day_info = {
            'date': day['date'],
            'total_count': day['count']
        }
        matching = [d for d in data['counts'] if d['date'] == day['date']]
        if len(matching) == 0:
            day_info['count'] = 0
        else:
            day_info['count'] = matching[0]['count']
        if day_info['count'] == 0 or day['count'] == 0:
            day_info['ratio'] = 0
        else:
            day_info['ratio'] = float(day_info['count']) / float(day['count'])
        counts.append(day_info)
    results['counts'] = sorted(counts, key=itemgetter('date'))
    results['total'] = sum([day['count'] for day in data['counts']])
    results['normalized_total'] = sum([day['count'] for day in all_stories['counts']])
    return results


@cache.cache_on_arguments(function_key_generator=key_generator)
def cached_story_split_count(mc_api_key, q, fq):
    local_mc = _mc_client()
    results = local_mc.storyCount(q, fq, split=True)
    return results


def sentence_list(mc_api_key, q, fq, rows=10):
    # can't cache by api key here because we need to use tool mc to get sentences
    return _cached_sentence_list(mc_api_key, q, fq, rows)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_sentence_list(mc_api_key, q, fq, rows, include_stories=True):
    # need to get an admin client with the tool key so they have sentence read permissions
    tool_mc = user_admin_mediacloud_client(mc_api_key)
    sentences = tool_mc.sentenceList(q, fq, rows=rows)
    if include_stories:
        for s in sentences:
            local_mc = _mc_client()
            s['story'] = local_mc.story(s['stories_id'])
    return sentences


def top_tags_with_coverage(q, fq, tag_sets_id, limit=TAG_COUNT_UI_LENGTH):
    tag_counts = _most_used_tags(q, fq, tag_sets_id, limit)
    coverage = cliff_coverage(q, fq)
    for t in tag_counts:  # add in pct of what's been run through CLIFF to total results
        t['pct'] = float(t['count']) / coverage['counts']
    coverage['results'] = tag_counts
    return coverage


def _most_used_tags(q, fq, tag_sets_id, limit=TAG_COUNT_UI_LENGTH):
    # top tags used in stories matching query (pass in None for no limit)
    api_key = _api_key()
    sentence_count_results = _cached_most_used_tags(api_key, q, fq, tag_sets_id)
    top_count_results = sentence_count_results[:limit] if limit is not None else sentence_count_results
    return top_count_results


def cliff_coverage(q, fq):
    # dict of info about stories tagged by CLIFF
    return tag_set_coverage(q, u'({}) AND {}'.format(q, processed_by_cliff_query_clause()), fq)


def tag_set_coverage(total_q, subset_q, fq):
    api_key = _api_key()
    coverage = {
        'totals': _cached_total_story_count(api_key, total_q, fq)['count'],
        'counts': _cached_total_story_count(api_key, subset_q, fq)['count'],
    }
    coverage['coverage_percentage'] = 0 if coverage['totals'] is 0 else float(coverage['counts'])/float(coverage['totals'])
    return coverage


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_most_used_tags(api_key, q, fq, tag_sets_id, sample_size=None):
    # top tags used in stories matching query
    # api_key used for caching at the user level
    local_mc = _mc_client()
    return local_mc.storyTagCount(q, fq, tag_sets_id=tag_sets_id, limit=sample_size)


def story_count(q, fq):
    api_key = _api_key()
    return _cached_total_story_count(api_key, q, fq)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_total_story_count(api_key, q, fq):
    # api_key is included to keep the cache at the user-level
    local_mc = _mc_client()
    count = local_mc.storyCount(q, fq)
    return count


def random_story_list(mc_api_key, q, fq, limit):
    return story_list_page(mc_api_key, q, fq, stories_per_page=limit, sort=mc.SORT_RANDOM)


def story_list_page(mc_api_key, q, fq, last_processed_stories_id=None, stories_per_page=1000, sort=mc.SORT_PROCESSED_STORIES_ID):
    return _cached_story_list_page(mc_api_key, q, fq, last_processed_stories_id, stories_per_page, sort)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_story_list_page(api_key, q, fq, last_processed_stories_id, stories_per_page, sort):
    # be user-specific in this cache to be careful about permissions on stories
    # api_key passed in just to make this a user-level cache
    local_client = _mc_client()
    return local_client.storyList(q, fq, last_processed_stories_id=last_processed_stories_id, rows=stories_per_page,
                                  sort=sort)


def media(media_id):
    api_key = _api_key()
    return _cached_media(api_key, media_id)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_media(api_key, media_id):
    # api_key passed in just to make this a user-level cache
    local_client = _mc_client()
    return local_client.media(media_id)


def word_count(q, fq, ngram_size, num_words, sample_size):
    api_key = _api_key()
    return _cached_word_count(api_key, q, fq, ngram_size, num_words, sample_size)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_word_count(api_key, q, fq, ngram_size, num_words, sample_size):
    local_mc = _mc_client()
    return local_mc.wordCount(q, fq, ngram_size=ngram_size, num_words=num_words, sample_size=sample_size)


def word2vec_google_2d(words):
    return _cached_word2vec_google_2d(words)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_word2vec_google_2d(words):
    # don't need to be user-level cache here - can be app-wide because results are from another service that doesn't
    # have any concept of permissioning
    word2vec_results = wordembeddings.google_news_2d(words)
    return word2vec_results


def tag_set(tag_sets_id):
    return _cached_tag_set(_api_key(), tag_sets_id)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_tag_set(api_key, tag_sets_id):
    local_mc = _mc_client()
    return local_mc.tagSet(tag_sets_id)


def _api_key():
    api_key = user_mediacloud_key() if is_user_logged_in() else TOOL_API_KEY
    return api_key


def _mc_client(admin=False):
    # return the user's client handler, or a tool one if not logged in
    if is_user_logged_in():
        client_to_use = user_mediacloud_client() if not admin else user_admin_mediacloud_client()
    else:
        client_to_use = mc
    return client_to_use
