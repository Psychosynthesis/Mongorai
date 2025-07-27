export const createWrapperAndAppendToBody = (
	wrapperTagName: string, wrapperElementId?: string, wrapperElementClass?: string
) => {
  const wrapperElement = document.createElement(wrapperTagName);
  if (wrapperElementId) { wrapperElement.setAttribute('id', wrapperElementId); }
	if (wrapperElementClass) { wrapperElement.className = wrapperElementClass; }
  document.body.appendChild(wrapperElement);
  return wrapperElement;
}
