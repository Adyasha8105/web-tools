import logging
from flask import jsonify, request
import flask_login
from multiprocessing import Pool
from functools import partial
from deco import concurrent, synchronized

from server import app, user_db, mc
from server.util.stringutil import ids_from_comma_separated_str
from server.util.request import form_fields_required, arguments_required, api_error_handler
from server.auth import user_mediacloud_key, user_admin_mediacloud_client, user_mediacloud_client, user_name, is_user_logged_in
from server.views.topics.apicache import cached_topic_timespan_list, topic_word_counts, cached_topic_word_counts
from server.views.topics import access_public_topic

logger = logging.getLogger(__name__)

WORD2VEC_TIMESPAN_POOL_PROCESSES = 10


@app.route('/api/topics/queued-and-running', methods=['GET'])
@flask_login.login_required
@api_error_handler
def does_user_have_a_running_topic():
    user_mc = user_mediacloud_client()
    queued_and_running_topics = []
    more_topics = True
    link_id = None
    while more_topics:
        results = user_mc.topicList(link_id=link_id, limit=100)
        topics = results['topics']
        queued_and_running_topics += [t for t in topics if t['state'] in ['running', 'queued']
                                      and t['user_permission'] in ['admin']]
        more_topics = 'next' in results['link_ids']
        if more_topics:
            link_id = results['link_ids']['next']
    return jsonify(queued_and_running_topics)


@app.route('/api/topics/favorites', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_favorites():
    user_mc = user_mediacloud_client()
    favorite_topic_ids = user_db.get_users_lists(user_name(), 'favoriteTopics')
    favorited_topics = [user_mc.topic(tid) for tid in favorite_topic_ids]
    for t in favorited_topics:
        t['isFavorite'] = True
        # t['detailInfo'] = get_topic_info_per_snapshot_timespan(t['topics_id'])
    return jsonify({'topics': favorited_topics})


@app.route('/api/topics/public', methods=['GET'])
@api_error_handler
def public_topics_list():
    public_topics = sorted_public_topic_list()
    if is_user_logged_in():
        public_topics = _add_user_favorite_flag_to_topics(public_topics)
    # for t in public_topics_list:
        # t['detailInfo'] = get_topic_info_per_snapshot_timespan(t['topics_id'])
    return jsonify({"topics": public_topics})


@app.route('/api/topics/personal', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_personal():
    user_mc = user_admin_mediacloud_client()
    link_id = request.args.get('linkId')
    results = user_mc.topicList(link_id=link_id, limit=500)
    results['topcs'] = _add_user_favorite_flag_to_topics(results['topics'])
    return jsonify(results)


def sorted_public_topic_list():
    # needs to support logged in or not
    if is_user_logged_in():
        local_mc = user_mediacloud_client()
    else:
        local_mc = mc
    public_topics = local_mc.topicList(public=True, limit=51)['topics']
    return sorted(public_topics, key=lambda t: t['name'].lower())


@app.route('/api/topics/<topics_id>/summary', methods=['GET'])
@api_error_handler
def topic_summary(topics_id):
    topic = _topic_summary(topics_id)
    return jsonify(topic)


def _topic_summary(topics_id):
    if access_public_topic(topics_id):
        local_mc = mc
    elif is_user_logged_in():
        local_mc = user_admin_mediacloud_client()
    else:
        return jsonify({'status': 'Error', 'message': 'Invalid attempt'})
    topic = local_mc.topic(topics_id)
    # add in snapshot and latest snapshot job status
    snapshots = local_mc.topicSnapshotList(topics_id)
    #snapshots = sorted([s['snapshot_date'] for s in snapshots], key=lambda, reverse=True)
    # snapshots = sorted(snapshots, key=snapshots.snapshot_date)
    snapshots = sorted(snapshots, key=lambda d:d['snapshot_date'])
    jobStatuses = mc.topicSnapshotGenerateStatus(topics_id)['job_states']
    most_recent_usable_snapshot = get_most_recent_snapshot_version(topics_id)
    topic['snapshots'] = {
        'list': snapshots,
        'jobStatus': jobStatuses,    # need to know if one is running
    }
    # add in spider job status
    topic['spiderJobs'] = local_mc.topicSpiderStatus(topics_id)['job_states']
    topic['currentVersion'] = most_recent_usable_snapshot
    if is_user_logged_in():
        _add_user_favorite_flag_to_topics([topic])

    '''
    # add in story counts, overall seed and spidered
    feedTotal = topic_story_count(local_mc, topics_id) # with q - but not passed in for summary
    total = topic_story_count(local_mc, topics_id, timespans_id=None, q=None)  # spidered count.. how?
    spidered = total - seedTotal
    topic['seedStories'] = seedTotal
    topic['spideredStories'] = spidered
    topic['totaltories'] = total
    '''
    return topic


def _add_user_favorite_flag_to_topics(topics):
    user_favorited = user_db.get_users_lists(user_name(), 'favoriteTopics')
    for t in topics:
        t['isFavorite'] = t['topics_id'] in user_favorited
    return topics


def get_most_recent_snapshot_version(topic_id):
    if not is_user_logged_in():
        local_mc = mc
    else:
        local_mc = user_admin_mediacloud_client()
    snapshots = {
        'list': local_mc.topicSnapshotList(topic_id),
    }
    most_recent_completed_snapshot = {}
    overall_timespan = {}
    for snp in snapshots['list']:
        if snp['searchable'] == 1 and snp['state'] == "completed":
            most_recent_completed_snapshot = snp
            most_recent_completed_snapshot['versions'] = len(snapshots['list'])
            timespans = cached_topic_timespan_list(user_mediacloud_key(), topic_id,
                                                   most_recent_completed_snapshot['snapshots_id'])
            for ts in timespans:
                if ts['period'] == "overall":
                    overall_timespan = ts

    return most_recent_completed_snapshot


@app.route('/api/topics/<topics_id>/snapshots/list', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_snapshots_list(topics_id):
    user_mc = user_admin_mediacloud_client()
    snapshots = user_mc.topicSnapshotList(topics_id)
    snapshots = sorted(snapshots)
    snapshot_status = mc.topicSnapshotGenerateStatus(topics_id)['job_states']    # need to know if one is running
    return jsonify({'list': snapshots, 'jobStatus': snapshot_status})


@app.route('/api/topics/<topics_id>/snapshots/generate', methods=['POST'])
@flask_login.login_required
@api_error_handler
def topic_snapshot_generate(topics_id):
    user_mc = user_admin_mediacloud_client()
    results = user_mc.topicGenerateSnapshot(topics_id)
    return jsonify(results)


@app.route('/api/topics/<topics_id>/snapshots/<snapshots_id>/timespans/list', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_timespan_list(topics_id, snapshots_id):
    foci_id = request.args.get('focusId')
    timespans = cached_topic_timespan_list(user_mediacloud_key(), topics_id, snapshots_id, foci_id)
    return jsonify({'list': timespans})


@app.route('/api/topics/<topics_id>/favorite', methods=['PUT'])
@flask_login.login_required
@form_fields_required('favorite')
@api_error_handler
def topic_set_favorited(topics_id):
    favorite = int(request.form["favorite"])
    username = user_name()
    if favorite == 1:
        user_db.add_item_to_users_list(username, 'favoriteTopics', int(topics_id))
    else:
        user_db.remove_item_from_users_list(username, 'favoriteTopics', int(topics_id))
    return jsonify({'isFavorite': favorite == 1})


@app.route('/api/topics/<topics_id>/update', methods=['PUT'])
@flask_login.login_required
@api_error_handler
def topic_update(topics_id):

    user_mc = user_admin_mediacloud_client()
    # top five cannot be empty fyi
    args = {
        'name': request.form['name'] if 'name' in request.form else None,
        'description': request.form['description'] if 'description' in request.form else None,
        'solr_seed_query': request.form['solr_seed_query'] if 'solr_seed_query' in request.form else None,
        'start_date': request.form['start_date'] if 'start_date' in request.form else None,
        'end_date': request.form['end_date'] if 'end_date' in request.form else None,
        'is_public': request.form['is_public'] if 'is_public' in request.form else None,
        'is_logogram': request.form['is_logogram'] if 'is_logogram' in request.form else None,
        'ch_monitor_id': request.form['ch_monitor_id'] if 'ch_monitor_id' in request.form
                                                          and request.form['ch_monitor_id'] != 'null'
                                                          and len(request.form['ch_monitor_id']) > 0 else None,
        'max_iterations': request.form['max_iterations'] if 'max_iterations' in request.form else None,
        'max_stories': request.form['max_stories'] if 'max_stories' in request.form else None,
        'twitter_topics_id': request.form['twitter_topics_id'] if 'twitter_topics_id' in request.form else None
    }

    # parse out any sources and collections to add
    media_ids_to_add = ids_from_comma_separated_str(request.form['sources[]'] if 'sources[]' in request.form else '')
    tag_ids_to_add = ids_from_comma_separated_str(request.form['collections[]']
                                                  if 'collections[]' in request.form else '')
    # hack to support twitter-only topics
    if (len(media_ids_to_add) is 0) and (len(tag_ids_to_add) is 0):
        media_ids_to_add = None
        tag_ids_to_add = None



    result = user_mc.topicUpdate(topics_id,  media_ids=media_ids_to_add, media_tags_ids=tag_ids_to_add, **args)
    topic = result['topics'][0]
    snapshots = user_mc.topicSnapshotList(topics_id)
    snapshots = sorted(snapshots, key=lambda d: d['snapshot_date'])

    # create snapshot and then conditionally spider (for admins)
    topic_version = len(snapshots) + 1
    start_spider = request.form['start_spider'] if 'start_spider' in request.form else False
    new_snapshot = user_mc.topicCreateSnapshot(topics_id, note=topic_version) # vs. generate into...
    if start_spider:  # or not admin
        spider_job = user_mc.topicSpider(topics_id,
                                         new_snapshot.snapshots_id)  # kick off a spider, which will also fill/generate snapshot data

    return topic_summary(result['topics'][0]['topics_id'])  # give them back new data, so they can update the client


@app.route("/api/topics/<topics_id>/spider", methods=['POST'])
@flask_login.login_required
@api_error_handler
def topic_spider(topics_id):
    user_mc = user_admin_mediacloud_client()
    spider_job = user_mc.topicSpider(topics_id)  # kick off a spider, which will also generate a snapshot
    return jsonify(spider_job)


@app.route('/api/topics/search', methods=['GET'])
@flask_login.login_required
@arguments_required('searchStr')
@api_error_handler
def topic_search():
    search_str = request.args['searchStr']
    mode = request.args['mode'] if 'mode' in request.args else 'list'
    user_mc = user_admin_mediacloud_client()
    results = user_mc.topicList(name=search_str, limit=50)
    if mode == 'full':
        matching_topics = results['topics']
    else:
        # matching_topics = [{'name': x['name'], 'id': x['topics_id']} for x in results['topics']]
        matching_topics = results['topics']
    return jsonify({'topics': matching_topics})


# Helper function for pooling word2vec timespans process
def grab_timespan_embeddings(api_key, topics_id, args, overall_words, overall_embeddings, ts):
    ts_word_counts = cached_topic_word_counts(api_key, topics_id, num_words=250,
                                              timespans_id=int(ts['timespans_id']), **args)

    # Remove any words not in top words overall
    ts_word_counts = [x for x in ts_word_counts if x['term'] in overall_words]

    # Replace specific timespan embeddings with overall so coordinates are consistent
    for word in ts_word_counts:
        word['w2v_x'] = overall_embeddings[word['term']][0]
        word['w2v_y'] = overall_embeddings[word['term']][1]

    return {'timespan': ts, 'words': ts_word_counts}


@app.route('/api/topics/<topics_id>/word2vec-timespans', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_w2v_timespan_embeddings(topics_id):
    args = {
        'snapshots_id': request.args.get('snapshotId'),
        'foci_id': request.args.get('focusId'),
        'q': request.args.get('q'),
    }

    # Retrieve embeddings for overall topic
    overall_word_counts = topic_word_counts(user_mediacloud_key(), topics_id, num_words=50, **args)
    overall_words = [x['term'] for x in overall_word_counts]
    overall_embeddings = {x['term']: (x['google_w2v_x'], x['google_w2v_y']) for x in overall_word_counts}

    # Retrieve top words for each timespan
    timespans = cached_topic_timespan_list(user_mediacloud_key(), topics_id, args['snapshots_id'], args['foci_id'])

    # Retrieve embeddings for each timespan
    p = Pool(processes=WORD2VEC_TIMESPAN_POOL_PROCESSES)
    func = partial(grab_timespan_embeddings, user_mediacloud_key(), topics_id, args, overall_words, overall_embeddings)
    ts_embeddings = p.map(func, timespans)

    return jsonify({'list': ts_embeddings})


@app.route('/api/topics/name-exists', methods=['GET'])
@flask_login.login_required
@arguments_required('searchStr')
@api_error_handler
def topic_name_exists():
    # Check if topic with name exists already
    # Have to do this in a unique method, instead of in topic_search because we need to use an admin connection
    # to media cloud to list all topics, but we don't want to return topics a user can't see to them.
    # :return: boolean indicating if topic with this name exists for not (case insensive check)
    search_str = request.args['searchStr']
    topics_id = int(request.args['topicId']) if 'topicId' in request.args else None
    matching_topics = mc.topicList(name=search_str, limit=15)
    if topics_id:
        matching_topic_names = [t['name'].lower().strip() for t in matching_topics['topics']
                                if t['topics_id'] != topics_id]
    else:
        matching_topic_names = [t['name'].lower().strip() for t in matching_topics['topics']]
    name_in_use = search_str.lower() in matching_topic_names
    return jsonify({'nameInUse': name_in_use})


@concurrent
def _topic_snapshot_worker(topics_id):
    user_mc = user_admin_mediacloud_client()
    return {
        'list': user_mc.topicSnapshotList(topics_id),
        'jobStatus': mc.topicSnapshotGenerateStatus(topics_id)['job_states']  # need to know if one is running
    }


@synchronized
def _add_snapshots_info_to_topics(topics):
    for t in topics:
        topics_id = t['topics_id']
        if t['state'] == 'error':
            t['snapshots'] = _topic_snapshot_worker(topics_id)
    return topics


@app.route('/api/topics/admin/list', methods=['GET'])
@flask_login.login_required
@api_error_handler
def topic_admin_list():
    user_mc = user_admin_mediacloud_client()
    # if a non-admin user calls this, using user_mc grantees this won't be a security hole
    # but for admins this will return ALL topics
    topics = user_mc.topicList(limit=500)['topics']
    # we also want snapshot info
    topics = _add_snapshots_info_to_topics(topics)
    return jsonify(topics)
