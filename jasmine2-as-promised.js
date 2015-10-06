function install( env ) {
	env = env || jasmine.getEnv()

	var methods = ['it', 'beforeEach', 'beforeAll', 'afterEach', 'afterAll']

	methods.forEach(function (methodName) {
		env[methodName] = wrap(env, env[methodName])
	})

	return env
}

function wrap (env, oldMethod) {
	return function () {
		var args = [].slice.call(arguments)

		args = args.map(function(val) {
			return typeof val === 'function' ? createWrapperFn(val) : val
		})

		return oldMethod.apply(env, args)
	}
}

function createWrapperFn (fn) {
	return function (done) {
		var isAlreadyAsync = fn.length > 0
		var result = fn.call(this, done);

		if (typeof result !== 'undefined' && typeof result.then === 'function') {
			result.then( function() {
				done();
			}, function(err) {
				done.fail('Promise rejected with ' + err)
			})
		} else if (!isAlreadyAsync) {
			done()
		}
	}
}

module.exports = install
module.exports.async = createWrapperFn