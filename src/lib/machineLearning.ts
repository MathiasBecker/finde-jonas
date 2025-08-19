import { Signal, signal } from '@preact/signals';
import * as tf from '@tensorflow/tfjs';
import { imageClasses, TrainingClass } from './states';

/**
 * @typedef {import('@preact/signals').Signal}
 */

export const MOBILE_NET_INPUT_WIDTH = 224;
export const MOBILE_NET_INPUT_HEIGHT = 224;
/** @type {import('@preact/signals').Signal<tf.GraphModel<string | tf.io.IOHandler> | null>} */
export const mbnModel: Signal<tf.GraphModel | null> = signal(null);
export const customModel: Signal<tf.Sequential | null> = signal(null);

export const processedClass = signal('');
export const predictionResult = signal([]);

/**
 * Loads the MobileNet model and warms it up so ready for use.
 **/
export async function loadMobileNetModel() {
	if (mbnModel.value !== null) {
		return;
	}
	const URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';

	mbnModel.value = await tf.loadGraphModel(URL, { fromTFHub: true });

	// Warm up the model by passing zeros through it once.
	tf.tidy(() => {
		const answer = mbnModel.value.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])) as tf.Tensor;
		console.info(answer.shape);
	});
}

export async function initCustomModel(classesLength) {
	resetModel();
	const newModel = tf.sequential();
	newModel.add(tf.layers.dense({ inputShape: [1024], units: 128, activation: 'relu' }));
	newModel.add(tf.layers.dense({ units: classesLength, activation: 'softmax' }));

	newModel.summary();

	// Compile the model with the defined optimizer and specify a loss function to use.
	newModel.compile({
		// Adam changes the learning rate over time which is useful.
		optimizer: 'adam',
		// Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
		// Else categoricalCrossentropy is used if more than 2 classes.
		loss: classesLength === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy',
		// As this is a classification problem you can record accuracy in the logs too!
		metrics: ['accuracy'],
	});

	customModel.value = newModel;
}

/**
 *
 * @param {tf.PixelData | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap} ref
 * @returns
 */
export function getImageFeatures(reference) {
	const imageFeatures = tf.tidy(() => {
		const imageFrameAsTensor = tf.browser.fromPixels(reference);
		const resizedTensorFrame = tf.image.resizeBilinear(imageFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);
		const normalizedTensorFrame = resizedTensorFrame.div(255) as tf.Tensor3D;
		const tfPRedict = mbnModel.value.predict(normalizedTensorFrame.expandDims()) as tf.Tensor;
		return tfPRedict.squeeze();
	});
	return imageFeatures;
}

export async function trainModel() {
	let currentState = [...imageClasses.value];
	currentState = currentState.filter((c) => c.isActive);

	const inputdata = [];
	const outputdata = [];

	for (const [index, classData] of currentState.entries()) {
		processedClass.value = classData.name;

		for (let index_ = 0; index_ < classData.imagesFeatures.length; index_++) {
			const imageFeatures = classData.imagesFeatures[index_];
			// check if imagefeatue is a tensor
			inputdata.push(imageFeatures);
			// inputdata.push();
			outputdata.push(index);
		}
	}

	tf.util.shuffleCombo(inputdata, outputdata);
	const outputsAsTensor = tf.tensor1d(outputdata, 'int32');
	const oneHotOutputs = tf.oneHot(outputsAsTensor, currentState.length);
	const inputsAsTensor = tf.stack(inputdata);

	await customModel.value.fit(inputsAsTensor, oneHotOutputs, { shuffle: true, batchSize: 5, epochs: 10, callbacks: { onEpochEnd: logProgress } });

	outputsAsTensor.dispose();
	oneHotOutputs.dispose();
	inputsAsTensor.dispose();
}

function logProgress(epoch, logs) {
	console.info(`Data for epoch ${epoch}`, logs);
}

export function resetModel() {
	customModel.value = null;
}

function getNormalized(values, left, right) {
	const min = Math.min(...values),
		max = Math.max(...values),
		factor = (right - left) / (max - min);
	return values.map((v) => (v - min) * factor + left);
}

export function predict(reference: HTMLImageElement): number[] {
	let predictionArray: number[] = [];

	tf.tidy(() => {
		const videoFrameAsTensor = tf.browser.fromPixels(reference).div(255) as tf.Tensor3D;
		const resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH], true);

		const imageFeatures = mbnModel.value.predict(resizedTensorFrame.expandDims()) as tf.Tensor;
		const tsPredict = customModel.value.predict(imageFeatures) as tf.Tensor;
		const prediction = tsPredict.squeeze();
		predictionArray = prediction.arraySync() as number[];
		// predictionArray = predictionArray.map((p) => Math.ceil(p * 100));
		predictionArray = getNormalized(predictionArray, 0, 100);
		predictionArray = predictionArray.map((p) => Number(p.toFixed(1)));
	});

	console.log({ predictionArray });
	return predictionArray;
}

export function highestIndex(array) {
	let highestIndex = 0;

	for (let index = 0; index < array.length; index++) {
		if (array[index] > array[highestIndex]) {
			highestIndex = index;
		}
	}

	return highestIndex;
}

export function mapResultToClass(predictionArray: number[], activeClasses: TrainingClass[], threshold: number = 10, maxEntries: number = 3): [number, TrainingClass][] {
	const mappedResultEntries = [];

	for (const [index, value] of predictionArray.entries()) {
		if (value > threshold) {
			mappedResultEntries.push([value, activeClasses[index]]);
		}
	}

	const sortedResults = mappedResultEntries.toSorted((a, b) => b[0] - a[0]);

	return sortedResults.slice(0, maxEntries);
}
