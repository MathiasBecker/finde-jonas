import './predict.css';

import { useSignal } from '@preact/signals';
import { $cn } from '../../lib/utils';
import { imageClasses, trained } from '../../lib/states';
import { predict, predictionResult } from '../../lib/machineLearning';

function Predict() {
	const dataURI = useSignal('');
	const inputType = useSignal('upload');

	function onChangeHandler(event) {
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.addEventListener('load', (event) => {
			/** @type {string} */
			const result = event.target.result as string;
			dataURI.value = result;
			const imgElement = document.createElement('img');

			imgElement.src = result;

			imgElement.addEventListener('load', async () => {
				const result = predict(imgElement);
				predictionResult.value = result;
			});
		});

		if (!file) {
			return;
		}

		reader.readAsDataURL(file);
	}

	return (
		<div class="predict">
			{trained.value && (
				<>
					<div className="predict-image">
						<div class={$cn('predict-image-wrapper', inputType.value !== 'upload' && 'hidden')}>
							<div class="predict-image-upload">
								<input id="predict-image-input" class="predict-image-input" type="file" accept="image/*" onChange={onChangeHandler} />
								<label htmlFor="predict-image-input" class="predict-image-input-label">
									<div class="predict-image-upload-text">{dataURI.value ? 'neues Bild hochladen' : 'Bild hochladen'}</div>
									<div class="upload-icon">
										<img class="icon" src="./image-up.svg" alt="" />
									</div>
								</label>
							</div>
							{dataURI.value !== '' && (
								<div className="predict-img-wrapper">
									<img class="predict-test-image" id="predict-test-image" src={dataURI.value} alt="" />
								</div>
							)}
						</div>
					</div>

					<div class="prediction">

						<div class="prediction-progress-bars">
							{imageClasses.value.map((p, index) => (
								<div key={index} class="progress-bar-class">
									<div class="progress-bar-class-name">{p.name}</div>
									<div class="progress-bar-class-progress-wrapper">
										{predictionResult.value.length > 0 && (
											<div class={$cn('progress-bar-class-progress', predictionResult.value[index] < 10 && 'small-bar')} style={`--progress-width: ${predictionResult.value[index]}`}>
												<span>
													{predictionResult.value[index]}
													%
												</span>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

export default Predict;
