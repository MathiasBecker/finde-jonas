import { useSignal } from '@preact/signals';

import './ImageClass.css';
import { updateUploadClass } from '../../lib/imageClasses';
import { useEffect, useRef } from 'preact/hooks';
import { $cn } from '../../lib/utils';

/** @typedef {import('../../lib/imageClasses').TrainingClass} TrainingClass */

/**
 *
 * @param {{trainingClass: TrainingClass}} params
 * @returns
 */
function ClassCard({ trainingClass }) {
	const editTitle = useSignal(false);
	const currentTitle = useSignal(trainingClass.name);
	const inputElement = useRef(null);

	async function onFileInput(event) {
		const files = event.target.files;

		if (!files) {
			return;
		}

		const newImageUrls = [];

		for (const f of files) {
			const reader = new FileReader();

			reader.addEventListener('load', (event) => {
				const dataUri = /** @type {string} */ event.target.result;

				newImageUrls.push(dataUri);

				if (newImageUrls.length === files.length) {
					updateUploadClass(trainingClass.name, { images: [...trainingClass.images, ...newImageUrls] });
				}
			});

			reader.addEventListener('error', (event) => {
				console.error(event);
				if (newImageUrls.length > 0) {
					updateUploadClass(trainingClass.name, { images: [...trainingClass.images, ...newImageUrls] });
				}
			});

			reader.readAsDataURL(f);
		}
	}

	useEffect(() => {
		if (editTitle.value) {
			inputElement.current.select();
		}
	});

	return (
		<li class={$cn(trainingClass.isActive && 'active-class', 'training-class-card')}>
			{/* CARD HEADER */}
			<div class="card-title">
				<h3 class="card-title--text">
					{currentTitle}
				</h3>
			</div>
			{/* CARD CONTENT */}
			<div class="card-body">
				{/* IMAGE UPLOAD */}
				<div class="card-image-gallery">
					{trainingClass.images.length > 0 && (
						<ul class="image-gallery-list">
							{trainingClass.images.map((dataUriImage, index) => (
								<li key={`${trainingClass.name}i${index}`} class="image-gallery-item">
									<button onClick={() => updateUploadClass(trainingClass.name, { images: trainingClass.images.filter((_, index_) => index_ !== index) })}>
										<img src={dataUriImage} alt="" />
									</button>
								</li>
							))}
						</ul>
					)}
					<div class="image-gallery-controls">
						<label htmlFor={`image-upload-${trainingClass.name}`} class="add-image-label tmNestedButton">
							Bilder hinzufügen
							<div class="upload-icon">
								<img class="icon" src="./image-up.svg" alt="" />
							</div>
						</label>
						<input multiple onInput={onFileInput} id={`image-upload-${trainingClass.name}`} type="file" accept={'image/*'} class="add-image-input" />
					</div>
				</div>
			</div>
		</li>
	);
}

export default ClassCard;
