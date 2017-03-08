import logging
import flask
from flask import jsonify, request, send_from_directory, send_file
import flask_login
import os
from multiprocessing import Process

from server import app, base_dir, mc
import server.util.csv as csv
from server.auth import user_mediacloud_key, is_user_logged_in, user_mediacloud_client
from server.util.request import arguments_required, filters_from_args, api_error_handler
from server.util import mapwriter
from server.views.topics import access_public_topic

DATA_DIR = os.path.join(base_dir, "data", "map-files")
MAP_TYPES = ['wordMap', 'linkMap']

logger = logging.getLogger(__name__)

@app.route('/api/topics/<topics_id>/map-files', methods=['GET'])
@api_error_handler
def map_files(topics_id):
    files = { 
        'wordMap': 'unsupported',
        'linkMap': 'not rendered'
    }

    if access_public_topic(topics_id) or is_user_logged_in():
        snapshots_id, timespans_id, foci_id = filters_from_args(request.args)
        map_type = MAP_TYPES[0] # no linkMaps yet
        status = None
        prefix = _get_file_prefix(map_type, topics_id, timespans_id)
        lock_filename = prefix+".lock"
        rendered_filename = prefix+".gexf"
        # check if rendered file is there
        is_rendered = os.path.isfile(os.path.join(DATA_DIR,rendered_filename))
        logger.warn(os.path.join(DATA_DIR,rendered_filename))
        logger.warn(is_rendered)
        if is_rendered:
            status = 'rendered'
        else:
            is_generating = os.path.isfile(os.path.join(DATA_DIR,lock_filename))
            if not is_generating:
                _start_generating_map_file(map_type, topics_id, timespans_id)
            status = 'generating'
        files[map_type] = status
        return jsonify(files)
    else:
        return jsonify({'status':'Error', 'message': 'Invalid attempt'})

@app.route('/api/topics/<topics_id>/map-files/<map_type>.<map_format>', methods=['GET'])
@arguments_required('timespanId')
@flask_login.login_required
def map_files_download(topics_id, map_type, map_format):
    logger.info(map_type+":"+map_format)
    mime_type = "text/plain"
    if map_format == "json":
        mime_type = "application/json"
    elif map_format == "gexf":
        mime_type = "application/octet-stream"
    else:
        mime_type = "text/plain"
    filename = map_type+"-"+topics_id+"-"+request.args['timespanId']+"."+map_format
    return send_from_directory(directory=DATA_DIR, filename=filename, 
        mimetype=mime_type, as_attachment=True)

@app.route('/api/topics/<topics_id>/map-files/fetchCustomMap', methods=['GET'])
@arguments_required( 'timespanId')
# @form_fields_required('color_field', 'num_media','include_weights')
# @flask_login.login_required
def map_files_download_custom(topics_id):
    user_mc= user_mediacloud_client()
    # how to treat these as req or default?
    optional_args = {
        'timespans_id': request.args['timespanId'] if 'timespanId' in request.args else None,
        'snapshots_id': request.args['snapshotId'] if 'snapshots_id' in request.args else None,
        'foci_id': request.args['fociId'] if 'foci_id' in request.args else None,
        'color_field': request.form['color_field'] if 'color_field' in request.form else 'media_type',
        'num_media': request.form['num_media'] if 'num_media' in request.form else 500,    # this is optional
        'include_weights': request.form['include_weights'] if 'include_weights' in request.form else 1,
        'num_links_per_medium': request.form['num_links_per_medium'] if 'num_links_per_medium' in request.form else None, 
    }
    filename = "link-map-"+topics_id+"-"+request.args['timespanId']+"."+ "gexf"
    result_stream = user_mc.topicMediaMap(topics_id, **optional_args)
    generator = (cell for row in result_stream  for cell in row)
    return flask.Response(generator, mimetype="attachment/octet", headers={"Content-Disposition": "attachment;filename="+filename})

def _start_generating_map_file(map_type, topics_id, timespans_id):
    file_prefix = _get_file_prefix(map_type, topics_id, timespans_id)
    # create map file
    lock_filename = file_prefix+'.lock'
    lock_filepath = os.path.join(DATA_DIR,lock_filename)
    open(lock_filepath, 'a').close()
    # generate maps
    file_path = os.path.join(DATA_DIR, file_prefix)
    p = Process(target=mapwriter.create_word_map_files, args=(topics_id, timespans_id, file_path))
    p.start()
    # mapwriter.create_word_map_files(topics_id, timespans_id, file_path)
    # remove lock file
    os.remove(lock_filepath)

def _get_file_prefix(map_type, topics_id, timespans_id):
    return map_type+"-"+str(topics_id)+"-"+str(timespans_id)
