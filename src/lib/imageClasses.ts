import { signal } from '@preact/signals';
import { getImageFeatures, predictionResult } from './machineLearning';
import { imageClasses, trained } from './states';

// global ID counter
const ID = signal(1);

function getDefaultProperties() {
	return {
		name: `Klasse ${ID.peek()}`,
		id: ID.peek(),
		description: 'Training Klasse',
		imagesFeatures: [],
		images: [],
		isActive: true,
	};
}

function findClassIndexByName(name) {
	return imageClasses.value.findIndex((c) => c.name === name);
}

// any change to the training data makes the trained model stale
function invalidateModel() {
	trained.value = false;
	predictionResult.value = [];
}

export function updateUploadClass(name, properties) {
	// shallow copy: structuredClone turned the stored feature tensors into plain objects
	const currentState = imageClasses.peek().map((c) => ({ ...c }));

	const index = findClassIndexByName(name);

	if (index === -1) {
		console.error(`No class with name ${name} found`);
		return;
	}

	currentState[index] = { ...currentState[index], ...properties };

	imageClasses.value = currentState;
	invalidateModel();
}

// append to the class's current images (not a copy captured when the upload started)
export function appendImages(name, dataUris: string[]) {
	const current = imageClasses.peek().find((c) => c.name === name);

	if (!current || dataUris.length === 0) {
		return;
	}

	updateUploadClass(name, { images: [...current.images, ...dataUris] });
}

export function addUploadClass(initalProperties) {
	const newClass = { ...getDefaultProperties(), ...initalProperties };

	imageClasses.value = [...imageClasses.value, newClass];
	ID.value = ID.value + 1;
	trained.value =	false;
}

export function removeUploadClass(name) {
	const index = findClassIndexByName(name);

	if (index === -1) {
		console.error(`No class with name ${name} found`);
		return;
	}

	imageClasses.value = imageClasses.value.filter((_, index_) => index_ !== index);

	trained.value =	false;
}

export async function generateImagesFeatures() {
	const currentState = imageClasses.value.filter((c) => c.isActive);

	// reset imagefeatures

	for (const c of currentState) {
		for (const feature of c.imagesFeatures as { dispose?: () => void }[]) {
			feature.dispose?.();
		}
		c.imagesFeatures = [];
	}

	const processedImages = signal(0);

	for (const classData of currentState) {
		for (const dataUri of classData.images) {
			const imgElement = new Image();
			imgElement.src = dataUri;

			await imgElement.decode();

			const imageFeatures = getImageFeatures(imgElement);
			processedImages.value += 1;
			classData.imagesFeatures = [...classData.imagesFeatures, imageFeatures];
		}
	}

	// keep inactive classes in the state instead of dropping them
	imageClasses.value = [...imageClasses.value];
}
