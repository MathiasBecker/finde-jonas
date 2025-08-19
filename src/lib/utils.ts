export function classNames(...classes) {
	const classNames = classes.filter(Boolean);
	// check if classes are all strings now
	const allStrings = classNames.every((c) => typeof c === 'string');

	if (!allStrings) {
		throw new Error('Conditional classes must be on the right side of the comparison');
	}
	// join classes
	const classString = classNames.join(' ');

	return classString;
}

export function $cn(...classes) {
	return classNames(...classes);
}

export function sleep(ms, max) {
	if (ms && !max) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	let time;

	if (!ms && !max) {
		ms = 1000;
		const min = ms - (ms / 4);
		max = ms + (ms / 4);

		time = getRandomNumber(min, max);
	}

	if (ms && max) {
		time = getRandomNumber(ms, max);
	}

	return new Promise((resolve) => setTimeout(resolve, time));
}

export function getRandomNumber(min, max) {
	const randomNumber = Math.random() * (max - min) + min;
	return randomNumber;
}

export function wait(t: number = 1000) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, t);
	});
}
