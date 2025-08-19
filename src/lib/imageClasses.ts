import { signal } from '@preact/signals';
import { getImageFeatures } from './machineLearning';
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

export function updateUploadClass(name, properties) {
	const currentState = structuredClone(imageClasses.peek());

	const index = findClassIndexByName(name);

	if (index === -1) {
		console.error(`No class with name ${name} found`);
		return;
	}

	currentState[index] = { ...currentState[index], ...properties };

	imageClasses.value = currentState;
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

	for (const c of currentState) (c.imagesFeatures = []);

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

	imageClasses.value = [...currentState];
}
