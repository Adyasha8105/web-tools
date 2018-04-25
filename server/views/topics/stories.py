import logging
from flask import jsonify, request, Response
import flask_login
from multiprocessing import Pool

from server import app, cliff, TOOL_API_KEY
from server.auth import is_user_logged_in
from server.cache import cache, key_generator
import server.util.csv as csv
import server.util.tags as tag_util
from server.util.request import api_error_handler
from server.auth import user_mediacloud_key, user_admin_mediacloud_client, user_mediacloud_client
from server.views.topics.apicache import topic_story_count, topic_word_counts, add_to_user_query, \
    WORD_COUNT_DOWNLOAD_COLUMNS, topic_ngram_counts, topic_story_list_by_page, get_media, topic_story_list, story_list
from server.views.topics import access_public_topic

logger = logging.getLogger(__name__)

PRIMARY_ENTITY_TYPES = ['PERSON', 'LOCATION', 'ORGANIZATION']

MEDIA_INFO_POOL_SIZE = 15


@app.route('/api/topics/<topics_id>/stories/<stories_id>', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story(topics_id, stories_id):
    if is_user_logged_in():
        local_mc = user_mediacloud_client()
        story_topic_info = topic_story_list(user_mediacloud_key(), topics_id, stories_id=stories_id)['stories'][0]
        '''
        all_fb_count = []
        more_fb_count = True
        link_id = 0
        while more_fb_count:
            fb_page = local_mc.topicStoryListFacebookData(topics_id, limit=100, link_id=link_id)

            all_fb_count = all_fb_count + fb_page['counts']
            if 'next' in fb_page['link_ids']:
                link_id = fb_page['link_ids']['next']
                more_fb_count = True
            else:
                more_fb_count = False
   
        for fb_item in all_fb_count:
            if int(fb_item['stories_id']) == int(stories_id):
                story_topic_info['facebook_collection_date'] = fb_item['facebook_api_collect_date']
        '''
    else:
        return jsonify({'status': 'Error', 'message': 'Invalid attempt'})

    story_info = local_mc.story(stories_id)  # add in other fields from regular call
    for k in story_info.keys():
        story_topic_info[k] = story_info[k]
    for tag in story_info['story_tags']:
        if tag['tag_sets_id'] == tag_util.GEO_TAG_SET:
            geonames_id = int(tag['tag'][9:])
            try:
                tag['geoname'] = _cached_geoname(geonames_id)
            except Exception as e:
                # query to CLIFF failed :-( handle it gracefully
                logger.exception(e)
                tag['geoname'] = {}
    return jsonify(story_topic_info)


@app.route('/api/stories/<stories_id>/storyUpdate', methods=['POST'])
@flask_login.login_required
@api_error_handler
def topic_story_update(stories_id):
    user_mc = user_admin_mediacloud_client()
    optional_args = {
        'title': request.form['title'] if 'title' in request.form else None,
        'description': request.form['description'] if 'description' in request.form else '',
        'guid': request.form['guid'] if 'guid' in request.form else 'guid',
        'url': request.form['url'] if 'url' in request.form else 'url',
        'language': request.form['language'] if 'language' in request.form else 'en',
        'publish_date': request.form['publish_date'] if 'publish_date' in request.form else None,
        'confirm_date': request.form['confirm_date'] if 'confirm_date' in request.form else False,
        'undateable': request.form['undateable'] if 'undateable' in request.form else False,
    }
    stories = user_mc.storyUpdate(stories_id, **optional_args)

    return jsonify(stories)


@cache.cache_on_arguments(function_key_generator=key_generator)
def _cached_geoname(geonames_id):
    return cliff.geonamesLookup(geonames_id)


@app.route('/api/topics/<topics_id>/stories/counts', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_counts(topics_id):
    if access_public_topic(topics_id):
        local_key = TOOL_API_KEY
    elif is_user_logged_in():
        local_key = user_mediacloud_key()
    else:
        return jsonify({'status': 'Error', 'message': 'Invalid attempt'})
    total = topic_story_count(local_key, topics_id, timespans_id=None, q=None)
    filtered = topic_story_count(local_key, topics_id)  # force a count with just the query
    return jsonify({'counts': {'count': filtered['count'], 'total': total['count']}})


@app.route('/api/topics/<topics_id>/stories/undateable-counts', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_undateable_count(topics_id):
    q = "tags_id_stories:{}".format(tag_util.STORY_UNDATEABLE_TAG)
    return _public_safe_topic_story_count(topics_id, q)


@app.route('/api/topics/<topics_id>/stories/english-counts', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_english_counts(topics_id):
    q = "language:en"
    return _public_safe_topic_story_count(topics_id, q)


def _public_safe_topic_story_count(topics_id, q):
    if access_public_topic(topics_id):
        total = topic_story_count(TOOL_API_KEY, topics_id, q=add_to_user_query(None))
        matching = topic_story_count(TOOL_API_KEY, topics_id, q=add_to_user_query(q))  # force a count with just the query
    elif is_user_logged_in():
        total = topic_story_count(user_mediacloud_key(), topics_id, q=add_to_user_query(None))
        matching = topic_story_count(user_mediacloud_key(), topics_id, q=add_to_user_query(q))  # force a count with just the query
    else:
        return jsonify({'status': 'Error', 'message': 'Invalid attempt'})
    return jsonify({'counts': {'count': matching['count'], 'total': total['count']}})


@app.route('/api/topics/<topics_id>/stories/<stories_id>/words', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_words(topics_id, stories_id):
    word_list = topic_word_counts(user_mediacloud_key(), topics_id, q='stories_id:'+stories_id)[:100]
    return jsonify(word_list)


@app.route('/api/topics/<topics_id>/stories/<stories_id>/words.csv', methods=['GET'])
@flask_login.login_required
def story_words_csv(topics_id, stories_id):
    query = add_to_user_query('stories_id:'+stories_id)
    ngram_size = request.args['ngram_size'] if 'ngram_size' in request.args else 1  # default to word count
    word_counts = topic_ngram_counts(user_mediacloud_key(), topics_id, ngram_size, q=query)
    return csv.stream_response(word_counts, WORD_COUNT_DOWNLOAD_COLUMNS,
                               'topic-{}-story-{}-sampled-ngrams-{}-word'.format(topics_id, stories_id, ngram_size))


@app.route('/api/topics/<topics_id>/stories/<stories_id>/inlinks', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_inlinks(topics_id, stories_id):
    inlinks = topic_story_list(user_mediacloud_key(), topics_id, link_to_stories_id=stories_id, limit=50)
    return jsonify(inlinks)


@app.route('/api/topics/<topics_id>/stories/<stories_id>/inlinks.csv', methods=['GET'])
@flask_login.login_required
def story_inlinks_csv(topics_id, stories_id):
    return stream_story_list_csv(user_mediacloud_key(), 'story-'+stories_id+'-inlinks', topics_id,
                                 link_to_stories_id=stories_id)


@app.route('/api/topics/<topics_id>/stories/<stories_id>/outlinks', methods=['GET'])
@flask_login.login_required
@api_error_handler
def story_outlinks(topics_id, stories_id):
    outlinks = topic_story_list(user_mediacloud_key(), topics_id, link_from_stories_id=stories_id, limit=50)
    return jsonify(outlinks)


@app.route('/api/topics/<topics_id>/stories/<stories_id>/outlinks.csv', methods=['GET'])
@flask_login.login_required
def story_outlinks_csv(topics_id, stories_id):
    return stream_story_list_csv(user_mediacloud_key(), 'story-'+stories_id+'-outlinks', topics_id,
                                 link_from_stories_id=stories_id)


@app.route('/api/topics/<topics_id>/stories', methods=['GET'])
@api_error_handler
def topic_stories(topics_id):
    if access_public_topic(topics_id):
        stories = topic_story_list(TOOL_API_KEY, topics_id, snapshots_id=None, timespans_id=None, foci_id=None, q=None)
    elif is_user_logged_in():
        stories = topic_story_list(user_mediacloud_key(), topics_id)
    else:
        return jsonify({'status': 'Error', 'message': 'Invalid attempt'})

    return jsonify(stories)


@app.route('/api/topics/<topics_id>/stories.csv', methods=['GET'])
@flask_login.login_required
def topic_stories_csv(topics_id):
    user_mc = user_admin_mediacloud_client()
    topic = user_mc.topic(topics_id)
    return stream_story_list_csv(user_mediacloud_key(), topic['name']+'-stories', topics_id)


def stream_story_list_csv(user_key, filename, topics_id, **kwargs):

    as_attachment = kwargs['as_attachment'] if 'as_attachment' in kwargs else True
    fb_data = kwargs['fb_data'] if 'fb_data' in kwargs else False
    all_stories = []
    params=kwargs.copy()

    merged_args = {
        'snapshots_id': request.args['snapshotId'],
        'timespans_id': request.args['timespanId'],
        'foci_id': request.args['focusId'],
        'q': request.args['q'],
        'sort': request.args['sort'],
    }
    params.update(merged_args)
    #
    if 'as_attachment' in params:
        del params['as_attachment']
    if 'fb_data' in params:
        del params['fb_data']
    if 'q' in params:
        params['q'] = params['q'] if 'q' not in [None, '', 'null', 'undefined'] else None
    params['limit'] = 1000  # an arbitrary value to let us page through with big pages

    props = ['stories_id', 'publish_date', 'title', 'url', 'language', 'ap_syndicated',
             'themes','subtopics',
             'media_id', 'media_name', 'media_url',
             'media_pub_country', 'media_pub_state', 'media_language', 'media_about_country',
             'media_media_type']

    if fb_data:
        all_fb_count = []
        more_fb_count = True
        link_id = 0
        local_mc = user_admin_mediacloud_client()
        while more_fb_count:
            fb_page = local_mc.topicStoryListFacebookData(topics_id, limit=100, link_id=link_id)

            all_fb_count = all_fb_count + fb_page['counts']
            if 'next' in fb_page['link_ids']:
                link_id = fb_page['link_ids']['next']
                more_fb_count = True
            else:
                more_fb_count = False

        # now iterate through each list and set up the fb collection date
        for s in all_stories:
            for fb_item in all_fb_count:
                if int(fb_item['stories_id']) == int(s['stories_id']):
                    s['facebook_collection_date'] = fb_item['facebook_api_collect_date']
        props.append('facebook_collection_date')

    timestamped_filename = csv.safe_filename(filename)
    headers = {
        "Content-Disposition": "attachment;filename=" + timestamped_filename
    }
    return Response(_topic_story_list_by_page_as_csv_row(user_key, topics_id, props, **params),
                    mimetype='text/csv; charset=utf-8', headers=headers)


# generator you can use to handle a long list of stories row by row (one row per story)
def _topic_story_list_by_page_as_csv_row(user_key, topics_id, props, **kwargs):
    yield u','.join(props) + u'\n'  # first send the column names
    link_id = 0
    for page in _topic_story_page_with_media(user_key, topics_id, link_id, **kwargs):
        for story in page['stories']:
            cleaned_row = csv.dict2row(props, story)
            row_string = u','.join(cleaned_row) + u'\n'
            yield row_string
        link_id += 1


def _media_info_worker(info):
    return get_media(info['user_key'], info['media_id'])


# generator you can use to do something for each page of story results
def _topic_story_page_with_media(user_key, topics_id, link_id, **kwargs):
    story_page = topic_story_list_by_page(user_key, topics_id, link_id=link_id, **kwargs)

    story_ids = [str(s['stories_id']) for s in story_page['stories']]
    stories_with_tags = story_list(user_key, 'stories_id:(' + " ".join(story_ids) + ")", kwargs['limit'])

    # build a media lookup table in parallel so it is faster
    pool = Pool(processes=MEDIA_INFO_POOL_SIZE)
    jobs = [{'user_key': user_key, 'media_id': s['media_id']} for s in story_page['stories']]
    job_results = pool.map(_media_info_worker, jobs)  # blocks until they are all done
    media_lookup = {j['media_id']: j for j in job_results}
    pool.terminate()

    # update story info for each story in the page, put it into the [stories] field, send updated page with stories back
    for s in story_page['stories']:

        # add in media metadata to the story (from page-level cache built earlier)
        media = media_lookup[s['media_id']]

        # add in foci/subtopic names
        for k, v in media['metadata'].iteritems():
             s[u'media_{}'.format(k)] = v['label'] if v is not None else None

        # build lookup for id => story for all stories in stories with tags (non topic results)
        for st in stories_with_tags:
    
            if s['stories_id'] == st['stories_id']:
                s.update(st)
    
                foci_names = [f['name'] for f in s['foci']]
                s['subtopics'] = ", ".join(foci_names)
    
                s['themes'] = ''
                story_tag_ids = [t['tags_id'] for t in s['story_tags']]
                if tag_util.NYT_LABELER_1_0_0_TAG_ID in story_tag_ids:
                    story_tag_ids = [t['tag'] for t in s['story_tags'] if t['tag_sets_id'] == tag_util.NYT_LABELS_TAG_SET_ID]
                    s['themes'] = ", ".join(story_tag_ids)
                # s is updated
                # how do I add s back into story_page?


    yield story_page # need links too

