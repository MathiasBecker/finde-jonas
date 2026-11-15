import './checking.css';

import { Signal, useSignal } from '@preact/signals';

import { secImgDataUris } from '../../lib/states';
import { wait } from '../../lib/utils';
import { predict } from '../../lib/machineLearning';

type CheckingState = 'idle' | 'loading-images' | 'compare-images' | 'finished';

function shuffle(array) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
}

export default function Checking() {
	const checkingState: Signal<CheckingState> = useSignal('idle');

	// shuffled order of secImgDataUris indexes, fixed for one run (was reshuffled on every render)
	const imageOrder: Signal<number[]> = useSignal([]);
	// position within imageOrder of the image currently shown in the slide
	const slidePosition = useSignal(-1);

	const compareImageIndex = useSignal(-1);
	const comparingMessage = useSignal('');

	const matchedImages = useSignal([]);

	async function slideImages(t = 50) {
		for (let position = 0; position < imageOrder.value.length; position++) {
			slidePosition.value = position;
			await wait(t);
		}
	}

	// function compareImages(t = 100) {
	// 	return new Promise<void>((resolve) => {
	// 		let currentIndex = 0;
	// 		const intervalID = setInterval(() => {
	// 			compareImageIndex.value = currentIndex;
	// 			const imgIndex = imageIndexes[currentIndex];
	// 			const { name } = secImgDataUris.value[imgIndex];

	// 			if (IMG_WITH_PERSON.has(Number.parseInt(name, 10))) {
	// 				comparingMessage.value = `Person erkannt.`;
	// 				matchedImages.value = [...matchedImages.value, imgIndex];
	// 			}
	// 			else {
	// 				comparingMessage.value = `keine Person erkannt.`;
	// 			}
	// 			currentIndex++;

	// 			if (currentIndex === imageIndexes.length) {
	// 				clearInterval(intervalID);
	// 				resolve();
	// 			}
	// 		}, t);
	// 	});
	// }

	// one image after the other: the old setInterval did not wait for the image to load,
	// so on slow machines images were checked twice or skipped
	async function predictImages(t = 100) {
		for (const [position, imgIndex] of imageOrder.value.entries()) {
			compareImageIndex.value = position;
			const imgElement = document.createElement('img');
			imgElement.src = secImgDataUris.value[imgIndex].dataUri;
			await imgElement.decode();

			const result = predict(imgElement);
			// index 1 is the class "Bilder mit Person"
			if (result[1] > 50) {
				comparingMessage.value = `Person erkannt.`;
				matchedImages.value = [...matchedImages.value, imgIndex];
			}
			else {
				comparingMessage.value = `keine Person erkannt.`;
			}
			await wait(t);
		}
	}

	async function startChecking() {
		const order = [...secImgDataUris.value.keys()];
		shuffle(order);
		imageOrder.value = order;
		slidePosition.value = -1;
		compareImageIndex.value = -1;
		comparingMessage.value = '';
		matchedImages.value = [];

		// show image slide
		checkingState.value = 'loading-images';
		await wait(1000);

		await slideImages(30);

		checkingState.value = 'compare-images';

		await wait();

		await predictImages(200);
		checkingState.value = 'finished';
	}

	return (
		<div class="checking">
			<div className="checking-title">
				{checkingState.value === 'idle' && (
					<button onClick={startChecking} class="tmButton">Überprüfung</button>
				)}

				{checkingState.value === 'loading-images' && (
					<h3>
						Lade Bilder
					</h3>
				)}

				{checkingState.value === 'compare-images' && (
					<h3>
						Person wird gesucht
					</h3>
				)}
				{checkingState.value === 'finished' && (
					<>
						<h3>
							Alle Bilder überprüft.
						</h3>
						<button onClick={startChecking} class="tmButton">Erneut überprüfen</button>
					</>
				)}

			</div>
			<div className="checking-body">
				<div className="checking-section">
					{checkingState.value === 'loading-images' && (
						<div className="checking-images">
							{/* image goes here */}
							{/* the two images shown before the current one in this run's order */}
							{slidePosition.value >= 2 && (
								<img class="previous-previous-checking-image" src={secImgDataUris.value[imageOrder.value[slidePosition.value - 2]].dataUri} alt="" />
							)}
							{slidePosition.value >= 1 && (
								<img class="previous-checking-image" src={secImgDataUris.value[imageOrder.value[slidePosition.value - 1]].dataUri} alt="" />
							)}
							{slidePosition.value >= 0 && (
								<img class="current-checking-image" src={secImgDataUris.value[imageOrder.value[slidePosition.value]].dataUri} alt="" />
							)}
						</div>
					)}
				</div>
				<div className="checking-section">
					<div className="checking-info">
						{checkingState.value === 'compare-images' && (
							<>
								<div class="compare-message">
									<h3>
										Analysiere Bild:
									</h3>
									<p class="image-index">
										{compareImageIndex.value + 1 }
									</p>
								</div>
								<div class="compare-message">
									<h3>
										Ergebnis:
									</h3>
									<p class="summary-message">
										{comparingMessage.value}
									</p>
								</div>
							</>
						)}
					</div>
				</div>
				<div className="checking-section">
					<div className="checking-process">
						{(checkingState.value === 'compare-images' || checkingState.value === 'finished') && (
							<>
								<h3>Gefundene Kamera Bilder:</h3>
								<ul class="found-images-list">
									{matchedImages.value.map((index) => (
										<li class="found-image-item" key={index}>
											{`Kamera: ${secImgDataUris.value[index].name}`}
											<img src={secImgDataUris.value[index].dataUri} alt="" />
										</li>
									))}
								</ul>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
