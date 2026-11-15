import './TrainingClasses.css';

import { $cn } from '../../lib/utils';
import ImageClassCard from './ImageClass';
import { generateImagesFeatures } from '../../lib/imageClasses';
import { imageClasses, trained } from '../../lib/states';
import { initCustomModel, predictionResult, processedClass, trainModel } from '../../lib/machineLearning';
import { useSignal } from '@preact/signals';

function TrainingClasses() {
	const isTraining = useSignal(false);
	const trainingError = useSignal(false);

	async function train() {
		// ignore a second click while a run is in progress
		if (isTraining.value) {
			return;
		}

		const activeClasses = imageClasses.value.filter((c) => c.isActive);

		if (activeClasses.length < 2) {
			alert('Es müssen mindestens 2 Klassen angegeben werden');
			return;
		}

		isTraining.value = true;
		trainingError.value = false;
		processedClass.value = '';
		// steps 2 and 3 unmount while untrained, so their old results are cleared
		trained.value = false;
		predictionResult.value = [];

		try {
			await initCustomModel(activeClasses.length);
			await generateImagesFeatures();
			await trainModel();
			trained.value = true;
		}
		catch (error) {
			console.error(error);
			trainingError.value = true;
		}
		finally {
			isTraining.value = false;
		}
	}

	return (
		<>
			<div class="training-classes">
				<ul class={$cn(imageClasses.value.length === 0 && 'hidden', 'classes-list')}>
					{imageClasses.value.map((c) => (
						<ImageClassCard trainingClass={c} key={c.name} />
					))}
				</ul>
			</div>
			<div className="train-button-container">
				<button className="tmButton train-btn" disabled={isTraining.value || imageClasses.value.some((c) => c.images.length === 0)} onClick={() => train()}>
					<div class="train-button--text">
						Trainieren
						<span class="status-icon">
							{isTraining.value && <img class="icon" src="./loading.svg" alt="" />}
							{trained.value && !isTraining.value && <img class="icon" src="./check.svg" alt="" />}
						</span>
					</div>
				</button>
				{trainingError.value && (
					<p class="training-error">Beim Trainieren ist ein Fehler aufgetreten. Bitte versuche es noch einmal.</p>
				)}
			</div>
		</>
	);
}

export default TrainingClasses;
