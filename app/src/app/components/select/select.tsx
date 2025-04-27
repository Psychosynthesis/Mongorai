import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import clsx from 'clsx';

import { FullscreenLayer } from "../fullscreen-layer/layer";
import './style.scss';

import type { SelectProps }  from './types';

export const Select: React.FC<SelectProps> = ({
	placeholder, currentIndexSetter, options, selectedIndex,  nonScrolledItems,
	listStyle, style, className,
}) => {
	const maxShowingItems = nonScrolledItems ? nonScrolledItems : 7;
	const [thisUnfolded, setUnfolded] = useState(false);
	const [optionListStyle, setListStyle] = useState<React.CSSProperties>({
		overflowY: (options.length > maxShowingItems) ? 'scroll' : 'auto',
		left: 0,
		...listStyle
	});

	const optionsListRef = useRef<HTMLDivElement>(null);
	const frontBoxRef = useRef<HTMLDivElement>(null);

	const clickHandler = (newIndex: number) => {
		setUnfolded(false);
		currentIndexSetter(newIndex);
	};

	const toggleFold = () => setUnfolded(!thisUnfolded);
	const fold = () => setUnfolded(false);

	const selectedItem = options.length ? (options[selectedIndex ? selectedIndex : 0]) : { caption: 'No items in select', value: '' };

	const mainClass = clsx({ 'custom-select': true, unfolded: thisUnfolded, [className!]: className });
	const placeholderClass = clsx({ 'placeholder-caption': true, 'shifted-caption': options.length && selectedIndex !== null });

	const recalcListCoords = () => {
		const refBlock = frontBoxRef?.current;
		if (refBlock) {
			const { top, left } = refBlock.getBoundingClientRect();
			setListStyle({
				...optionListStyle,
				top: top,
				left: left,
			});
		}
	}

	useEffect(() => {
		const refBlock = frontBoxRef?.current;
		if (refBlock) {
			recalcListCoords();
		}
	}, [frontBoxRef.current]);

	useLayoutEffect(() => {
		const refBlock = optionsListRef?.current;
		if (refBlock) {
			// @ts-ignore
			if ((optionListStyle.left + refBlock.offsetWidth) > window.innerWidth) {
				setListStyle({
					...optionListStyle,
					left: window.innerWidth - refBlock.offsetWidth
				});
			}
		}
	}, [optionsListRef.current]);

	useEffect(() => {
		window.addEventListener("scroll", recalcListCoords, true);
		return () => {
			window.removeEventListener("scroll", recalcListCoords, true);
		}
  }, []);

	return (
		<>
			<div className={mainClass} style={style}>
				<div className="select-front-box" onClick={toggleFold} ref={frontBoxRef}>
					{placeholder && <div className={placeholderClass}>{placeholder}</div>}
					<div className="current-caption">{selectedItem.caption}</div>
					<div className="rotating-tick">›</div>
				</div>
			</div>

			<FullscreenLayer show={thisUnfolded} onClick={fold} className="custom-select-overlay">
				{options.length &&
					<div className="options-list" style={optionListStyle} ref={optionsListRef}>
						{options.map((opt, i) => (
							<div
								className={selectedItem.value === opt.value ? 'current-option' : ''}
								onClick={() => clickHandler(i)}
								key={opt.value + '-key'}
							>{ opt.caption }</div>
						))}
					</div>
				}
			</FullscreenLayer>
		</>
	);
};
