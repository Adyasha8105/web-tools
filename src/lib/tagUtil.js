
// tags indicating how the date on a story was guessed
export const TAG_SET_DATE_GUESS_METHOD = 508;

// tags indicating what extractor was used to pull content out of the story url
export const TAG_SET_EXTRACTOR_VERSION = 1354;

// tags indicating which version of the geocoder this was geocoded with
export const TAG_SET_GEOCODER_VERSION = 1937;
// tags for each geonames place
export const TAG_SET_GEOGRAPHIC_PLACES = 1011;

// tags indicating which version of the nyt theme engine the story was processed with
export const TAG_SET_NYT_THEMES_VERSION = 1964;
// tags for each nyt theme
export const TAG_SET_NYT_THEMES = 1963;

// tags indicating what media type a source is
export const TAG_SET_MEDIA_TYPE = 1972;

// tag sets that hold collections we want to show to the user
export const TAG_SET_MC_ID = 5;
export const TAG_SET_EMM_ID = 556;
export const TAG_SET_GV_ID = 597;
export const TAG_SET_PARTISAN_RETWEETS_ID = 1959;
export const TAG_SET_ABYZ_GEO_COLLECTIONS = 15765102;
const VALID_COLLECTION_IDS = [TAG_SET_EMM_ID, TAG_SET_GV_ID, TAG_SET_MC_ID, TAG_SET_PARTISAN_RETWEETS_ID, TAG_SET_ABYZ_GEO_COLLECTIONS];

// tags for each country, allowed us to indicate which country a media source was published in
export const TAG_SET_PUBLICATION_COUNTRY = 1935;
export const TAG_SET_PUBLICATION_STATE = 1962;
export const TAG_SET_PRIMARY_LANGUAGE = 1969;
export const TAG_SET_COUNTRY_OF_FOCUS = 1970;
const VALID_METADATA_IDS = [TAG_SET_PUBLICATION_COUNTRY, TAG_SET_PUBLICATION_STATE, TAG_SET_PRIMARY_LANGUAGE,
  TAG_SET_COUNTRY_OF_FOCUS, TAG_SET_MEDIA_TYPE];

/**
 * Call this to verify a tag set id is one of the metadata options for a media source
 */
export function isMetaDataTagSet(metadataTagSetsId) {
  return VALID_METADATA_IDS.includes(metadataTagSetsId);
}

/**
 * Call this to verify a tag set id holds media source collections we want to show to the user
 */
export function isCollectionTagSet(tagSetsId) {
  return VALID_COLLECTION_IDS.includes(tagSetsId);
}

export function anyCollectionTagSets(tagSetIdList) {
  return tagSetIdList.reduce((any, tagSetId) => isCollectionTagSet(tagSetId) || any, false);
}

// Use this if you want to sort a set of tags by name (it falls back to tag if there is no label)
export function compareTagNames(a, b) {
  const nameA = (a.label || a.tag).toUpperCase(); // ignore upper and lowercase
  const nameB = (b.label || b.tag).toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

function tagForMetadata(metadataTagSetsId, allTags) {
  return allTags.find(tag => tag.tag_sets_id === metadataTagSetsId);
}

export function mediaSourceMetadataProps(mediaSource) {
  return {
    pubCountryTag: tagForMetadata(TAG_SET_PUBLICATION_COUNTRY, mediaSource.media_source_tags),
    pubStateTag: tagForMetadata(TAG_SET_PUBLICATION_STATE, mediaSource.media_source_tags),
    primaryLangaugeTag: tagForMetadata(TAG_SET_PRIMARY_LANGUAGE, mediaSource.media_source_tags),
    countryOfFocusTag: tagForMetadata(TAG_SET_COUNTRY_OF_FOCUS, mediaSource.media_source_tags),
    mediaTypeTag: tagForMetadata(TAG_SET_MEDIA_TYPE, mediaSource.media_source_tags),
  };
}
