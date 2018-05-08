/**
 * External dependencies
 */
import { upperFirst, camelCase, map, find } from 'lodash';

/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { hasEntitiesByKind } from './selectors';
import { addEntities } from './actions';

export const defaultEntities = [
	{ name: 'postType', kind: 'root', key: 'slug', baseUrl: '/wp/v2/types' },
	{ name: 'media', plural: 'mediaItems', kind: 'root', baseUrl: '/wp/v2/media' },
	{ name: 'taxonomy', kind: 'root', key: 'slug', baseUrl: '/wp/v2/taxonomies', plural: 'taxonomies' },
];

export const kinds = [
	{ name: 'postType', loadEntities: loadPostTypeEntities },
];

/**
 * Returns the list of post type entities.
 *
 * @return {Array} entities
 */
async function loadPostTypeEntities() {
	const postTypes = await apiRequest( { path: '/wp/v2/types?context=edit' } );
	return map( postTypes, ( postType, name ) => {
		return {
			kind: 'postType',
			baseUrl: '/wp/v2/' + postType.rest_base,
			name,
		};
	} );
}

/**
 * Returns the entity's getter method name given its kind and name.
 *
 * @param {string}  kind      Entity kind.
 * @param {string}  name      Entity name.
 * @param {string}  prefix    Function prefix.
 * @param {boolean} usePlural Whether to use the plural form or not.
 *
 * @return {string} Method name
 */
export const getMethodName = ( kind, name, prefix = 'get', usePlural = false ) => {
	const entity = getEntity( kind, name );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix = upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix = usePlural && entity.plural ? upperFirst( camelCase( entity.plural ) ) : nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

/**
 * Loads the kind entities into the store.
 *
 * @param {Object} state Global state
 * @param {string} kind  Kind
 */
export async function* loadKindEntities( state, kind ) {
	const hasEntities = hasEntitiesByKind( state, kind );

	if ( hasEntities ) {
		return;
	}

	const kindConfig = find( kinds, { name: kind } );
	if ( ! kindConfig ) {
		return;
	}

	const entities = await kindConfig.loadEntities();
	yield addEntities( entities );
}
