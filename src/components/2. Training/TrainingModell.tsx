import { useSignal } from '@preact/signals';
import { generateImagesFeatures } from '../../lib/imageClasses';
import { imageClasses, trained } from '../../lib/states';

import './TrainingModell.css';
import { $cn } from '../../lib/utils';
import { initCustomModel, processedClass, trainModel } from '../../lib/machineLearning';

function TrainingModell() {
	const modelLoaded = useSignal(false);
	const loadedClasses = useSignal([]);
	const isTraining = useSignal(false);
	const failedLoading = useSignal(false);

	async function train() {
		isTraining.value = true;
		processedClass.value = '';
		loadedClasses.value = [];

		const activeImageClassesLength = imageClasses.value.filter((c) => c.isActive).length;

		if (activeImageClassesLength < 2) {
			alert('Es müssen mindestens 2 Klassen angegeben werden');
			isTraining.value = false;
			return;
		}

		await initCustomModel(activeImageClassesLength);

		await generateImagesFeatures();

		await trainModel();
		modelLoaded.value = true;
		trained.value = true;

		isTraining.value = false;
	}

	processedClass.subscribe((className) => {
		if (className === '') {
			return;
		}

		const set = new Set(loadedClasses.value);
		set.add(className);
		loadedClasses.value = [...set];
	});

	return (
		<div className="training-modell">
			<div className="training-modell-controls">
				<button class="training-button tmButton" onClick={() => train()}>
					Modell trainieren
				</button>
			</div>
			<div className="training-modell-status">
				{failedLoading.value && (
					<div className="status-notifier">
						<p class="status-text">Fehler beim Laden</p>
						<div class="status-icon">
							<img class="icon" src="./x.svg" alt="" />
						</div>
					</div>
				)}

				{(trained.value || isTraining.value) && !failedLoading.value && (
					<>
						{loadedClasses.value.map((c) => (
							<div key={c} className="status-notifier">
								<p class="status-text">{`Klasse ${c} geladen`}</p>
								<div class="status-icon">
									<img class="icon" src="./check.svg" alt="" />
								</div>
							</div>
						))}
						<div className="status-notifier">
							<p class={$cn(trained.value && 'is-trained', 'status-text')}>{`Modell ${trained.value ? 'bereit' : 'wartet'}`}</p>
							<div class="status-icon">
								{isTraining.value && <img class="icon" src="./loading.svg" alt="" />}
								{trained.value && !isTraining.value && <img class="icon" src="./check.svg" alt="" />}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default TrainingModell;
