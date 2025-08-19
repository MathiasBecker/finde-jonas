import { Signal, signal } from '@preact/signals';

export const debug = signal(false);
export const initialised = signal(false);
export const trained = signal(false);

export type TrainingClass = {
	name: string;
	id: number;
	description: string;
	imagesFeatures: unknown[];
	images: string[];
	isActive: boolean;
};

const classNoPerson = {
	name: 'Bilder ohne Person',
	id: 0,
	description: 'Klasse ohne Personen',
	imagesFeatures: [],
	images: [],
	isActive: true,
};

const classWithPerson = {
	name: 'Bilder mit Person',
	id: 1,
	description: 'Klasse mit Personen',
	imagesFeatures: [],
	images: [],
	isActive: true,
};

export const imageClasses: Signal<TrainingClass[]> = signal([classNoPerson, classWithPerson]);

// load secImg
export const secImgDataUris: Signal<{ name: string; dataUri: string }[]> = signal();

const secImgImport = import.meta.glob('../assets/*.jpg', { eager: true }) as Record<string, { default: string }>;

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
for (const [_relativePath, imgObject] of Object.entries(secImgImport)) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	canvas.width = 300;
	canvas.height = 300;
	const imgElement = new Image();

	imgElement.src = imgObject.default;
	//
	const fileNameWExtension = _relativePath.split('/').pop() as string;
	const fileName = fileNameWExtension.split('.')[0];
	// eslint-disable-next-line unicorn/prefer-top-level-await
	imgElement.decode().then(() => {
		context.drawImage(imgElement, 0, 0);
		const dataUri = canvas.toDataURL('image/jpeg');

		secImgDataUris.value = secImgDataUris.value ? [...secImgDataUris.value, { name: fileName, dataUri }] : [{ name: fileName, dataUri }];

		canvas.remove();
	});
}

const imgWithPerson = [19, 20, 37, 38, 45, 48, 52, 55, 54, 53, 56, 57, 58];

export const IMGWITHPWERSON = new Set(imgWithPerson);
