import './checking.css';

import { Signal, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';

import { IMG_WITH_PERSON, secImgDataUris } from '../../lib/states';
import { wait } from '../../lib/utils';
import { predict } from '../../lib/machineLearning';

// the "Auflösung zeigen" button is hidden for now; set to true to show it again
const SHOW_REVEAL_BUTTON = false;

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

	// "Auflösung": mark hits as right/wrong and list the missed Jonas images
	const revealed = useSignal(false);
	// index into secImgDataUris of the image shown enlarged, null = closed
	const zoomIndex: Signal<number | null> = useSignal(null);

	const isJonas = (index: number) => IMG_WITH_PERSON.has(Number.parseInt(secImgDataUris.value[index].name, 10));

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				zoomIndex.value = null;
			}
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	// eslint-disable-next-line react-hooks/exhaustive-deps -- register once; zoomIndex is a stable signal
	}, []);

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
		revealed.value = false;
		zoomIndex.value = null;

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
						<div class="checking-actions">
							{SHOW_REVEAL_BUTTON && (
								<button onClick={() => { revealed.value = !revealed.value; }} class="tmButton">
									{revealed.value ? 'Auflösung ausblenden' : 'Auflösung zeigen'}
								</button>
							)}
							<button onClick={startChecking} class="tmButton">Erneut überprüfen</button>
						</div>
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
						{(checkingState.value === 'compare-images' || checkingState.value === 'finished') && (() => {
							const show = revealed.value && checkingState.value === 'finished';
							const matched: number[] = matchedImages.value;
							const correct = matched.filter((index) => isJonas(index)).length;
							const missed = [...secImgDataUris.value.keys()].filter((index) => isJonas(index) && !matched.includes(index));
							const renderItem = (index: number, verdict: '' | 'correct' | 'wrong' | 'missed') => (
								<li class={`found-image-item ${verdict}`} key={index}>
									<span>
										{`Kamera: ${secImgDataUris.value[index].name}`}
										{verdict === 'correct' && ' ✓'}
										{verdict === 'wrong' && ' ✗'}
									</span>
									<img
										src={secImgDataUris.value[index].dataUri}
										alt={`Kamerabild ${secImgDataUris.value[index].name}`}
										title="Zum Vergrößern klicken"
										onClick={() => { zoomIndex.value = index; }}
									/>
								</li>
							);
							return (
								<>
									<h3>Gefundene Kamera Bilder:</h3>
									{show && (
										<p class="reveal-summary">
											{`${correct} von ${correct + missed.length} Bildern mit Jonas gefunden · ${matched.length - correct} falsch erkannt · ${missed.length} übersehen`}
										</p>
									)}
									<ul class="found-images-list">
										{matched.map((index) => renderItem(index, show ? (isJonas(index) ? 'correct' : 'wrong') : ''))}
									</ul>
									{show && missed.length > 0 && (
										<>
											<h3 class="missed-title">Übersehen (Jonas ist drauf):</h3>
											<ul class="found-images-list">
												{missed.map((index) => renderItem(index, 'missed'))}
											</ul>
										</>
									)}
								</>
							);
						})()}
					</div>
				</div>
			</div>
			{zoomIndex.value !== null && createPortal(
				<div class="image-zoom" onClick={() => { zoomIndex.value = null; }}>
					<img src={secImgDataUris.value[zoomIndex.value].dataUri} alt={`Kamerabild ${secImgDataUris.value[zoomIndex.value].name}`} />
					<p>
						{`Kamera: ${secImgDataUris.value[zoomIndex.value].name}`}
						{revealed.value && checkingState.value === 'finished' && (isJonas(zoomIndex.value) ? ' · Jonas ist drauf' : ' · Jonas ist nicht drauf')}
						{' · Klicken oder Esc zum Schließen'}
					</p>
				</div>,
				document.body,
			)}
		</div>
	);
}
