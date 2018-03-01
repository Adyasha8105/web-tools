import datetime
import logging
import flask_login
from flask_login import current_user
import mediacloud

from server import db, login_manager

logger = logging.getLogger(__name__)

ROLE_ADMIN = 'admin'                        # Do everything, including editing users
ROLE_ADMIN_READ_ONLY = 'admin-readonly'     # Read access to admin interface
ROLE_MEDIA_EDIT = 'media-edit'              # Add / edit media; includes feeds
ROLE_STORY_EDIT = 'story-edit'              # Add / edit stories
ROLE_TM = 'tm'                              # Topic mapper; includes media and story editing
ROLE_STORIES_API = 'stories-api'            # Access to the stories api
ROLE_SEARCH = 'search'                      # Access to the /search pages
ROLE_TM_READ_ONLY = 'tm-readonly'           # Topic mapper; excludes media and story editing


# User class
class User(flask_login.UserMixin):

    def __init__(self, profile):
        self.profile = profile
        self.name = profile['email']
        self.id = profile['api_key']
        self.active = profile['active']
        self.created = datetime.datetime.now()

    def is_active(self):
        return self.active

    @property
    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True

    def has_auth_role(self, role):
        my_roles = self.profile['auth_roles']
        return (ROLE_ADMIN in my_roles) or (role in my_roles)

    def create_in_db_if_needed(self):
        if self.exists_in_db():
            logger.debug("user %s already in db", self.name)
            db.update_user(self.name, {'api_key': self.id, 'profile': self.profile})
            return
        logger.debug("user %s created in db", self.name)
        db.add_user(self.name, self.id, self.profile)

    def exists_in_db(self):
        return db.includes_user_named(self.name)

    def get_properties(self):
        return {
            'email': self.name,
            'key': self.id,
            'profile': self.profile
        }

    @classmethod
    def get(cls, userid):
        try:
            return User(db.find_by_api_key(userid)['profile'])
            # return User.cached[userid]
        except Exception:
            # be safer here... if anything goes wrong make them login again
            return None

#User.cached = {}


@login_manager.user_loader
def load_user(userid):
    # Flask-login uses this method to lookup users to see if they are logged in already
    logger.debug("trying to load_user %s", userid)
    return User.get(userid)


def is_user_logged_in():
    if current_user is None:
        return False
    return current_user.is_authenticated


def login_user(user):
    flask_login.login_user(user, remember=True)
    user.create_in_db_if_needed()
    logger.debug("  login succeeded")


def user_has_auth_role(role):
    return current_user.has_auth_role(role)


def create_and_cache_user(profile):
    user = User(profile)
    user.create_in_db_if_needed()
    #User.cached[user.id] = user
    logger.debug("  added to user cache %s", user.id)
    return user


def load_from_db_by_username(username):
    return db.find_by_username(username)


def user_name():
    return current_user.name


def user_mediacloud_key():
    # Return the IP-restricted API token for this user from the cookie (note: this is the server IP)
    return current_user.profile['api_key']


def user_admin_mediacloud_client():
    # Return a mediacloud client for the logged in user
    user_mc_key = user_mediacloud_key()
    user_mc = mediacloud.api.AdminMediaCloud(user_mc_key)
    return user_mc


def user_mediacloud_client():
    # Return a mediacloud client for the logged in user
    user_mc_key = user_mediacloud_key()
    user_mc = mediacloud.api.MediaCloud(user_mc_key)
    return user_mc
