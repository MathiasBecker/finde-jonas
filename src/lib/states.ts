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
export const secImgDataUris: Signal<{ name: string; dataUri: string }[]> = signal([]);

const secImgImport = import.meta.glob('../assets/*.jpg', { eager: true }) as Record<string, { default: string }>;

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
for (const [_relativePath, imgObject] of Object.entries(secImgImport)) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	const imgElement = new Image();

	imgElement.src = imgObject.default;
	//
	const fileNameWExtension = _relativePath.split('/').pop() as string;
	const fileName = fileNameWExtension.split('.')[0];
	// eslint-disable-next-line unicorn/prefer-top-level-await
	imgElement.decode().then(() => {
		// size the canvas to the (EXIF-oriented) image; a fixed 300x300 cropped 3.jpg and 4.jpg
		canvas.width = imgElement.naturalWidth;
		canvas.height = imgElement.naturalHeight;
		context.drawImage(imgElement, 0, 0);
		const dataUri = canvas.toDataURL('image/jpeg');

		secImgDataUris.value = [...secImgDataUris.value, { name: fileName, dataUri }];

		canvas.remove();
	});
}

// camera images that show Jonas (1, 6, 12, 16 and 51 were missing)
const imgWithPerson = [1, 6, 12, 16, 19, 20, 37, 38, 45, 48, 51, 52, 53, 54, 55, 56, 57, 58];

export const IMG_WITH_PERSON = new Set(imgWithPerson);
