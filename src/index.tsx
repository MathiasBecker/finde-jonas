import '@unocss/reset/tailwind.css';
import './style.css';
import './app.css';

import { render } from 'preact';

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import Section from './components/Section/Section';
import TrainingClasses from './components/1. TrainingClasses/TrainingClasses.js';

import { loadMobileNetModel } from './lib/machineLearning';

import { initialised } from './lib/states';
import Predict from './components/3. Test/predict';
import Checking from './components/4. Checking/checking';

// @ts-expect-error Var is defined in Vite but no d.ts file in this project.
console.info(`Last Build: ${__VERSION__.date}`);

// number of sections rendered below; the last index is SECTION_COUNT - 1
const SECTION_COUNT = 3;

// prevent reloading via shortcut
document.addEventListener('keydown', (event) => {
	if (event.key == 'F5' || (event.ctrlKey && event.key == 'r') || (event.ctrlKey && event.key == 'R')) {
		event.preventDefault();
	}
});

export function App() {
	const activeSection = useSignal(0);
	const loadError = useSignal(false);

	// register the arrow-key navigation once, not on every render
	useEffect(() => {
		let arrowKeyPressed = false;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
				return;
			}
			if (arrowKeyPressed) {
				return;
			}
			arrowKeyPressed = true;
			if (event.key === 'ArrowRight') {
				nextSection();
			}
			else {
				previousSection();
			}
		}

		function onKeyUp(event: KeyboardEvent) {
			if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
				arrowKeyPressed = false;
			}
		}

		document.addEventListener('keydown', onKeyDown);
		document.addEventListener('keyup', onKeyUp);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('keyup', onKeyUp);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps -- register once; the handlers only use the stable activeSection signal
	}, []);

	// load the model once; show an error with a retry instead of an endless spinner
	async function init() {
		loadError.value = false;
		try {
			await loadMobileNetModel();
			initialised.value = true;
		}
		catch (error) {
			console.error(error);
			loadError.value = true;
		}
	}

	useEffect(() => {
		if (!initialised.value) {
			init();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps -- load the model once on mount
	}, []);

	function nextSection() {
		if (activeSection.value >= SECTION_COUNT - 1) {
			return;
		}
		activeSection.value = activeSection.value + 1;
	}

	function previousSection() {
		if (activeSection.value === 0) {
			return;
		}
		activeSection.value = activeSection.value - 1;
	}

	return (
		<div class="App">
			{!initialised.value && !loadError.value && (
				<div className="loading">
					<h2>App wird geladen...</h2>
					<span class="mbn-spinner" />
				</div>
			)}

			{!initialised.value && loadError.value && (
				<div className="loading">
					<h2>Das KI-Modell konnte nicht geladen werden.</h2>
					<p>Bitte prüfe die Internetverbindung und versuche es noch einmal.</p>
					<button class="tmButton" onClick={() => init()}>
						Erneut versuchen
					</button>
				</div>
			)}

			{initialised.value && (
				<>
					<header class="header">
						<h1>Finde Jonas!</h1>
						{import.meta.env.DEV && (
							<div class="debug-control">
								<button class="debug-button" onClick={() => loadMobileNetModel()}>
									Load MBN
								</button>
							</div>
						)}
					</header>
					<main class="main">
						<div class="content">
							<Section size="small" title="1. Klassen trainieren" active={activeSection.value === 0}>
								<TrainingClasses />
							</Section>
							<Section
								size="small"
								title="2. Klassen testen"
								active={activeSection.value === 1}
								notTrainedMessage="Du musst zunächst dein Modell trainieren, bevor du es testen kannst."
							>
								<Predict />
							</Section>
							<Section
								size="medium"
								title="3. Überprüfung der Überwachungskamera"
								active={activeSection.value === 2}
								notTrainedMessage="Du musst zunächst dein Modell trainieren, damit du die Überwachungskamerabilder prüfen kannst."
							>
								<Checking />
							</Section>
						</div>
					</main>
					<div className="controlbar">
						<button onClick={previousSection} className="prevSection tmButton" disabled={activeSection.value === 0}>
							Zurück
						</button>
						<button onClick={nextSection} className="nextSection tmButton" disabled={activeSection.value >= SECTION_COUNT - 1}>
							Weiter
						</button>
					</div>
				</>
			)}
		</div>
	);
}

render(<App />, document.body);
