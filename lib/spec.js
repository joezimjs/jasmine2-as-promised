import installPromises from '../jasmine2-as-promised'

let asyncify = installPromises.async;
const FAILED = 'failed'
const PASSED = 'passed'

describe('jasmine2-as-promised', function () {
	let env

	function statusOf (spec) {
		try {
			return spec.result.status
		} catch (e) {
			throw new Error('Invalid Spec; Cannot Get Status')
		}
	}

	function statusMessageOf (spec) {
		try {
			return spec.result.message
		} catch (e) {
			throw new Error('Invalid Spec; Cannot Get Status Message')
		}
	}

	beforeEach(function () {
		env = installPromises(new jasmine.Env())
	})

    it('should not break existing synchronous specs' , function (done) {
        let spec1, spec2

        env.describe('faux suite', function () {
            spec1 = env.it('faux test', function () {
                env.expect(true).toBe(true)
            })

            spec2 = env.it('faux test', function () {
                env.expect(true).toBe(false)
            })
        })

        env.addReporter({jasmineDone: function() {
            expect(statusOf(spec1)).toBe(PASSED)
            expect(statusOf(spec2)).toBe(FAILED)
            done()
        }})

        env.execute()
    })

    it('should not break existing asynchronous specs', function (done) {
        let spec1, spec2

        env.describe('faux suite', function () {
            spec1 = env.it('faux test', function (done) {
                Promise.resolve("PASS").then(done, done.fail)
            })

            spec2 = env.it('faux test', function (done) {
                Promise.reject("FAIL").then(done, done.fail)
            })
        })

        env.addReporter({jasmineDone: function() {
            expect(statusOf(spec1)).toBe(PASSED)
            expect(statusOf(spec2)).toBe(FAILED)
            done()
        }})

        env.execute()
    })

	it('should work with returned promises', function (done) {
		let spec1, spec2

		env.describe('faux suite', function () {
			spec1 = env.it('faux test', function () {
                return Promise.resolve("PASS")
            })
            spec2 = env.it('faux test', function () {
                return Promise.reject("FAIL")
            })
		})

		env.addReporter({jasmineDone: function() {
            expect(statusOf(spec1)).toBe(PASSED)
			expect(statusOf(spec2)).toBe(FAILED)
			done()
		}})

		env.execute()
	})

    it('should work when asyncified', asyncify(async function () {
        let resolveTo = 1
        let value = await Promise.resolve(resolveTo)

        try {
            let value2 = await Promise.reject("REJECTED")
        } catch (e) {}

        expect(value).toBe(resolveTo)
    }))

    installPromises()

    it('should work with global environment', async function () {
        let resolveTo = 1
        let value = await Promise.resolve(resolveTo)

        expect(value).toBe(resolveTo)
    })
})
