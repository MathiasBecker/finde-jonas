import { ComponentChildren } from 'preact';
import { trained } from '../../lib/states';
import { $cn } from '../../lib/utils';
import './Section.css';

type Properties = {
	active: boolean;
	title: string;
	notTrainedMessage?: string;
	size: 'small' | 'medium' | 'large';
	children: ComponentChildren;
};

function Section({ active, title, notTrainedMessage = '', size, children }: Properties) {
	return (
		<div class={$cn(active && 'active-section', 'section', `section-${size}`)}>
			<div className="section-content">
				<h2 class="section-title">{title}</h2>

				{!trained.value && (
					<div class="section-description">{notTrainedMessage}</div>
				)}

				{(trained.value || notTrainedMessage === '') && children}
			</div>
		</div>
	);
}

export default Section;
