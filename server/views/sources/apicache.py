import codecs
import datetime
import json
import operator

import server.util.tags as tags
from server import mc
from server.auth import user_mediacloud_client
from server.cache import cache, key_generator
from server.util.api_helper import add_missing_dates_to_split_story_counts
from server.views.sources import FEATURED_COLLECTION_LIST


def tags_in_tag_set(mc_api_key, tag_sets_id, only_public_tags, use_file_cache=False):
    return tags.tag_set_with_tags(mc_api_key, tag_sets_id, only_public_tags, use_file_cache)


@cache.cache_on_arguments(function_key_generator=key_generator)
def cached_tag_set_file(file_path):
    # hold the file in memory to reduce reads
    with codecs.open(file_path, 'r', 'utf-8') as json_data:
        data = json.load(json_data)
        return data


def tag_set_with_private_collections(mc_api_key, tag_sets_id):
    return tags_in_tag_set(mc_api_key, tag_sets_id, False, True)


def tag_set_with_public_collections(mc_api_key, tag_sets_id):
    return tags_in_tag_set(mc_api_key, tag_sets_id, True, True)


def featured_collections():
    return _cached_featured_collection_list()


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_featured_collection_list():
    return [mc.tag(tags_id) for tags_id in FEATURED_COLLECTION_LIST]


def collection_source_representation(mc_api_key, collection_id):
    return _cached_collection_source_representation(mc_api_key, collection_id)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_collection_source_representation(mc_api_key, collection_id):
    sample_size = 1000
    stories = random_story_list(mc_api_key, 'tags_id_media:' + str(collection_id), rows=sample_size)
    media_representation = {}
    for s in stories:
        if s['media_id'] not in media_representation:
            media_representation[s['media_id']] = {
                'media_id': s['media_id'],
                'media_name': s['media_name'],
                'media_url': s['media_url'],
                'sample_size': sample_size,
                'stories': 0
            }
        media_representation[s['media_id']]['stories'] += 1
    for media_id in media_representation:
        media_representation[media_id]['story_pct'] = float(media_representation[media_id]['stories']) / float(
            sample_size)
    return sorted(media_representation.values(), key=operator.itemgetter('stories'))


def random_story_list(mc_api_key, q, fq=None, rows=1000):
    return _cached_random_story_list(mc_api_key, q, fq, rows)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_random_story_list(mc_api_key, q, fq, rows):
    return mc.storyList(q, fq, rows=rows, sort=mc.SORT_RANDOM)


def last_year_split_story_count(user_mc_key, q='*'):
    return _cached_last_year_split_story_count(user_mc_key, q)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_last_year_split_story_count(user_mc_key, q='*'):
    # Helper to fetch split story counts over a timeframe for an arbitrary query
    user_mc = user_mediacloud_client()
    last_n_days = 365
    start_date = datetime.date.today()-datetime.timedelta(last_n_days)
    end_date = datetime.date.today()-datetime.timedelta(1)  # yesterday
    fq = user_mc.publish_date_query(start_date, end_date)
    results = user_mc.storyCount(solr_query=q, solr_filter=fq, split=True, split_period='day')
    results['counts'] = add_missing_dates_to_split_story_counts(results['counts'], start_date, end_date)
    results['total_story_count'] = sum([r['count'] for r in results['counts']])
    return results
