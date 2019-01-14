/**
 * @fileoverview
 * @author Pim de Wit // pim@pdw.io
 */

/** @private */
let _cache = {};

/** @private */
const _pendingPromises = {};

/**
 * Load a file, either from the cache or from
 * @param path
 * @returns {Promise}
 * @constructor
 */
export async function load(path) {
  const blob = _cache[path];

  if (blob) {
    return new Promise(resolve => resolve(blob));
  } else if (_pendingPromises[path]) {
    return _pendingPromises[path];
  } else {
    return await _fetchFile(path);
  }
}

/**
 * Load a batch of files.
 * @param {Array.<String>} assetsToLoad
 * @returns {Promise}
 */
export function loadBatch(assetsToLoad) {
  return new Promise((resolve, reject) => {
    // Will contain the downloaded assets.
    const assets = [];

    // For each path, download the file and push it to the assets array.
    assetsToLoad.forEach(path => assets.push(load(path)));

    // Resolve with the files if all files are loaded successfully.
    Promise.all(assets).then(loadedAssets => resolve(loadedAssets));
  });
}

/**
 * In case you want to see the contents of the cache.
 * @returns {Object}
 */
export function getCache() {
  return _cache;
}

/**
 * Remove a key and its property from the cache.
 * @param {String} key The key to remove.
 */
export function remove(key) {
  delete _cache[key];
}

/**
 * Remove all keys and its properties from the cache.
 * @constructor
 */
export function removeAll() {
  _cache = {};
}

/**
 * Fetch a file and return it.
 * @param path
 * @returns {Promise}
 * @private
 */
async function _fetchFile(path) {
  const response = await fetch(path);
  const blob = await response.blob();
  let fileToReturn = null;

  // Remove the promise from the 'pending list' as it is now stored in the cache.
  delete _pendingPromises[path];

  _cache[path] = blob.slice();

  if (path.includes('.jpg') || path.includes('.png')) {
    fileToReturn = await createImageBitmap(blob);
  }

  // Store the promise in case the same file gets called again before it's able to cache.
  _pendingPromises[path] = fileToReturn;

  return fileToReturn;
}
