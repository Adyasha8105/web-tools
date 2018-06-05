import logging

import server.util.csv as csv
import server.util.tags as tag_utl
from server.util.geo import COUNTRY_GEONAMES_ID_TO_APLHA3, HIGHCHARTS_KEYS
from server.cache import cache, key_generator
from server.auth import user_admin_mediacloud_client
from server.views.sources.apicache import cached_timeperiod_story_count
from server.views.stories import QUERY_LAST_MONTH, QUERY_ENGLISH_LANGUAGE

logger = logging.getLogger(__name__)


@cache.cache_on_arguments(function_key_generator=key_generator)
def cached_geotag_count(user_mc_key, query):
    user_mc = user_admin_mediacloud_client()
    res = user_mc.storyTagCount(query, [QUERY_LAST_MONTH, QUERY_ENGLISH_LANGUAGE], tag_sets_id=tag_utl.GEO_TAG_SET)
    full_count = cached_timeperiod_story_count(user_mc, query, QUERY_LAST_MONTH)['count']
    res = [r for r in res if int(r['tag'].split('_')[1]) in COUNTRY_GEONAMES_ID_TO_APLHA3.keys()]
    for r in res:
        geonamesId = int(r['tag'].split('_')[1])
        if geonamesId not in COUNTRY_GEONAMES_ID_TO_APLHA3.keys():   # only include countries
            continue
        r['geonamesId'] = geonamesId
        r['alpha3'] = COUNTRY_GEONAMES_ID_TO_APLHA3[geonamesId]
        r['pct'] = (float(r['count'])/float(full_count))
        r['value'] = (float(r['count']))
        for hq in HIGHCHARTS_KEYS:
            if hq['properties']['iso-a3'] == r['alpha3']:
                r['iso-a2'] = hq['properties']['iso-a2']
    return res


def stream_geo_csv(user_mc_key, filename, item_id, which):
    info = {}
    info = cached_geotag_count(user_mc_key, which+":"+str(item_id))
    props = ['label', 'count']
    return csv.stream_response(info, props, filename)
