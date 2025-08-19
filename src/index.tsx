import 'preact/debug';

import '@unocss/reset/tailwind.css';
import './style.css';
import './app.css';

import { render } from 'preact';

import { useSignal } from '@preact/signals';
import Section from './components/Section/Section';
import TrainingClasses from './components/1. TrainingClasses/TrainingClasses.js';

import { loadMobileNetModel } from './lib/machineLearning';

import { initialised } from './lib/states';
import Predict from './components/3. Test/predict';
import Checking from './components/4. Checking/checking';

// @ts-expect-error Var is defined in Vite but no d.ts file in this project.
console.info(`Last Build: ${__VERSION__.date}`);

async function init() {
	if (initialised.value) {
		return;
	}
	await loadMobileNetModel();
	// add two uploadClasses
}

// prevent reloading via shortcut
document.addEventListener('keydown', (event) => {
	if (event.key == 'F5' || (event.ctrlKey && event.key == 'r') || (event.ctrlKey && event.key == 'R')) {
		event.preventDefault();
	}
});

export function App() {
	const activeSection = useSignal(0);
	const arrowKeyPressed = useSignal(false);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowRight') {
			if (arrowKeyPressed.value) {
				return;
			}
			nextSection();
			arrowKeyPressed.value = true;
		}
		if (event.key === 'ArrowLeft') {
			if (arrowKeyPressed.value) {
				return;
			}
			previousSection();
			arrowKeyPressed.value = true;
		}
	});

	document.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			arrowKeyPressed.value = false;
		}
	});

	function nextSection() {
		if (activeSection.value === 4) {
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

	init().then(() => {
		initialised.value = true;
	});

	return (
		<div class="App">
			{!initialised.value && (
				<div className="loading">
					<h2>App wird geladen...</h2>
					<span class="mbn-spinner" />
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
								notTrainedMessage="Du musst zunächst dein Modell trainieren, damit du die überwachungskamerabilder prüfen kannst."
							>
								<Checking />
							</Section>
						</div>
					</main>
					<div className="controlbar">
						<button onClick={previousSection} className="prevSection tmButton">
							Zurück
						</button>
						<button onClick={nextSection} className="nextSection tmButton">
							Weiter
						</button>
					</div>
				</>
			)}
		</div>
	);
}

render(<App />, document.body);
