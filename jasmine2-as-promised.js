/**
 * Takes a Jasmine environment object and augments some of its functions so that they have
 * better support for Promises. Instead of manually needing to call the `done` callback, you should
 * now be able to just return a Promise and the resolution/rejection will determine if it's done
 * successfully or not.
 * @param  {Object} env Jasmine environment to install the new methods on (optional)
 * @return {Object}     The augmented Jasmine environment
 */
function install( env ) {
	// if an environment isn't given, grab the global environment from Jasmine
	env = env || jasmine.getEnv()

	// list of the names of methods that will be augmented
	var methods = ['it', 'beforeEach', 'beforeAll', 'afterEach', 'afterAll']

	// go through every method name and update the method with that name on the environment
	methods.forEach(function (methodName) {
		env[methodName] = wrap(env, env[methodName])
		env[methodName]
	})

	return env
}

/**
 * For the given built in Jasmine function, return a new function for overriding it. This new
 * function simply wraps the old one so we can aument how the functions run in order to support
 * returning Promises (instead of needing to use the `done` callback).
 * @param  {Object}   env       Jasmine Environment to install new method on
 * @param  {Function} oldMethod The original Jasmine function that will be augmented
 * @return {Function}           The new function that augments the built in Jasmine function
 */
function wrap (env, oldMethod) {
	function newMethod () {
		// convert the arguments to an array
		var args = [].slice.call(arguments)

		// go through the arguments and wrap the one that is a function
		args = args.map(function(val) {
			// don't touch anything but functions; wrap those
			return typeof val === 'function' ? createWrapperFn(val) : val
		})

		// pass the args with the wrapped function to the original method
		return oldMethod.apply(env, args)
	}

	newMethod.old = oldMethod;

	return newMethod;
}

/**
 * This creates the function that is given to the built in `it` function. It wraps the function
 * that the user wrote so that it can add functionality for handling promises returned from their
 * spec function.
 * @param  {Function} fn The user's spec function
 * @return {Function}    The function wrapping the user's function
 */
function createWrapperFn (fn) {
	return function (done) {
		// checks to see if the registered function is using the `done` callback
		var isAlreadyAsync = fn.length > 0
		// call the given spec function, giving them our `done` function so they can use it if they
		// need it. Also take the return value, in case it is a Promise
		var result = fn.call(this, done)

		if (typeof result !== 'undefined' && typeof result.then === 'function') {
			// if a promise is returned, be `done` when it finishes
			result.then( function() {
				// success if the promise is resolved
				done()
			}, function(err) {
				// fail if the promise is rejected
				// use a custom failure message to help indicate where the failure comes from
				done.fail('Promise rejected with ' + err)
			})
		} else if (!isAlreadyAsync) {
			// if a `done` callback isn't being used, then we can just call it ourselves right away
			done()
		}
		// otherwise, the spec is already using the `done` callback and we let them handle it
	}
}

module.exports = install
module.exports.install = install
module.exports.async = createWrapperFn