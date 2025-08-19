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

	const activeImageIndex = useSignal(-1);
	const imageIndexes = [...Array.from({ length: secImgDataUris.value.length }).keys()];

	const compareImageIndex = useSignal(-1);
	const comparingMessage = useSignal('test');

	const matchedImages = useSignal([]);

	shuffle(imageIndexes);

	function slideImages(t = 50) {
		return new Promise<void>((resolve) => {
			let currentIndex = 0;
			const intervalID = setInterval(() => {
				activeImageIndex.value = imageIndexes[currentIndex];
				currentIndex++;

				if (currentIndex === imageIndexes.length) {
					clearInterval(intervalID);
					resolve();
				}
			}, t);
		});
	}

	// function compareImages(t = 100) {
	// 	return new Promise<void>((resolve) => {
	// 		let currentIndex = 0;
	// 		const intervalID = setInterval(() => {
	// 			compareImageIndex.value = currentIndex;
	// 			const imgIndex = imageIndexes[currentIndex];
	// 			const { name } = secImgDataUris.value[imgIndex];

	// 			if (IMGWITHPWERSON.has(Number.parseInt(name, 10))) {
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

	function predictImages(t = 100) {
		return new Promise<void>((resolve) => {
			let currentIndex = 0;
			const intervalID = setInterval(() => {
				compareImageIndex.value = currentIndex;
				const imgIndex = imageIndexes[currentIndex];
				const { dataUri } = secImgDataUris.value[imgIndex];

				const imgElement = document.createElement('img');

				imgElement.src = dataUri;

				imgElement.addEventListener('load', async () => {
					const result = predict(imgElement);
					if (result[1] > 50) {
						comparingMessage.value = `Person erkannt.`;
						matchedImages.value = [...matchedImages.value, imgIndex];
					}
					else {
						comparingMessage.value = `keine Person erkannt.`;
					}
					currentIndex++;
					if (currentIndex === imageIndexes.length) {
						clearInterval(intervalID);
						resolve();
					}
				});
			}, t);
		});
	}

	async function startChecking() {
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
					<h3>
						Alle Bilder überprüft.
					</h3>
				)}

			</div>
			<div className="checking-body">
				<div className="checking-section">
					{checkingState.value === 'loading-images' && (
						<div className="checking-images">
							{/* image goes here */}
							{activeImageIndex.value > 2 && (
								<img class="previous-previous-checking-image" src={secImgDataUris.value[activeImageIndex.value - 2].dataUri} alt="" />
							)}
							{activeImageIndex.value > 1 && (
								<img class="previous-checking-image" src={secImgDataUris.value[activeImageIndex.value - 1].dataUri} alt="" />
							)}
							{activeImageIndex.value >= 0 && (
								<img class="current-checking-image" src={secImgDataUris.value[activeImageIndex.value].dataUri} alt="" />
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
										Ergebniss:
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
