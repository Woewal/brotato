/**
 * limits your function to be called at most every W milliseconds, where W is wait.
 * Calls over W get dropped.
 * Thanks to Pat Migliaccio.
 * see https://medium.com/@pat_migliaccio/rate-limiting-throttling-consecutive-function-calls-with-queues-4c9de7106acc
 * @param fn
 * @param wait
 * @example let throttledFunc = throttle(myFunc,500);
 */
export function throttle(fn: Function, wait: number) {
	let isCalled = false;

	return function (...args) {
		if (!isCalled) {
			fn(...args);
			isCalled = true;
			setTimeout(function () {
				isCalled = false;
			}, wait);
		}
	};
}
