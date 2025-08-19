import './TrainingClasses.css';

import { $cn } from '../../lib/utils';
import ImageClassCard from './ImageClass';
import { generateImagesFeatures } from '../../lib/imageClasses';
import { imageClasses, trained } from '../../lib/states';
import { initCustomModel, processedClass, trainModel } from '../../lib/machineLearning';
import { useSignal } from '@preact/signals';

function TrainingClasses() {
	const modelLoaded = useSignal(false);
	const loadedClasses = useSignal([]);
	const isTraining = useSignal(false);
	// const failedLoading = useSignal(false);

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
		<>
			<div class="training-classes">
				<ul class={$cn(imageClasses.value.length === 0 && 'hidden', 'classes-list')}>
					{imageClasses.value.map((c) => (
						<ImageClassCard trainingClass={c} key={c.name} />
					))}
				</ul>
			</div>
			<div className="train-button-container">
				<button className="tmButton train-btn" disabled={imageClasses.value.some((c) => c.images.length === 0)} onClick={() => train()}>
					<div class="train-button--text">
						Trainieren
						<span class="status-icon">
							{isTraining.value && <img class="icon" src="./loading.svg" alt="" />}
							{trained.value && !isTraining.value && <img class="icon" src="./check.svg" alt="" />}
						</span>
					</div>
				</button>
			</div>
		</>
	);
}

export default TrainingClasses;
