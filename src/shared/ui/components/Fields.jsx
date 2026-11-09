import { Children, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

export function TextField({ label, error, hint, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className="input" {...props} />
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, options = [], children, placeholder, ...props }) {
  const generatedId = useId();
  const triggerRef = useRef(null);
  const rootRef = useRef(null);
  const listboxRef = useRef(null);
  const optionRefs = useRef([]);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const {
    value = '',
    onChange,
    disabled = false,
    required = false,
    id = generatedId,
    className = '',
    'aria-label': ariaLabel,
  } = props;
  const normalizedOptions = children
    ? Children.toArray(children).flatMap((child) =>
        child?.type === 'option'
          ? [{ value: child.props.value, label: child.props.children, disabled: child.props.disabled }]
          : [],
      )
    : [
        ...(placeholder ? [{ value: '', label: placeholder, disabled: true }] : []),
        ...options,
      ];
  const selectedIndex = normalizedOptions.findIndex(
    (option) => String(option.value) === String(value),
  );
  const selectedOption = normalizedOptions[selectedIndex];
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const listboxId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const optionId = (index) => `${id}-option-${index}`;

  useEffect(() => {
    if (!open) return undefined;
    function closeOutside(event) {
      if (
        !rootRef.current?.contains(event.target) &&
        !listboxRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const listbox = listboxRef.current;
    const trigger = triggerRef.current;
    if (!listbox || !trigger || typeof listbox.showPopover !== 'function') {
      return undefined;
    }

    function positionMenu() {
      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const maxHeight = Math.min(288, viewportHeight * 0.4);
      const estimatedHeight = Math.min(maxHeight, normalizedOptions.length * 44 + 12);
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const shouldOpenAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      listbox.style.position = 'fixed';
      listbox.style.inset = 'auto';
      listbox.style.margin = '0';
      listbox.style.left = `${Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8))}px`;
      listbox.style.width = `${rect.width}px`;
      listbox.style.maxHeight = `${Math.max(96, Math.min(maxHeight, shouldOpenAbove ? spaceAbove : spaceBelow))}px`;
      listbox.style.top = shouldOpenAbove ? 'auto' : `${Math.max(8, rect.bottom + 4)}px`;
      listbox.style.bottom = shouldOpenAbove
        ? `${Math.max(8, viewportHeight - rect.top + 4)}px`
        : 'auto';
      setOpenAbove(shouldOpenAbove);
    }

    if (!listbox.matches(':popover-open')) listbox.showPopover();
    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    window.visualViewport?.addEventListener('resize', positionMenu);
    window.visualViewport?.addEventListener('scroll', positionMenu);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
      window.visualViewport?.removeEventListener('resize', positionMenu);
      window.visualViewport?.removeEventListener('scroll', positionMenu);
      if (listbox.matches(':popover-open')) listbox.hidePopover();
    };
  }, [open, normalizedOptions.length]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  useEffect(
    () => () => {
      window.clearTimeout(typeaheadTimerRef.current);
    },
    [],
  );

  function showMenu() {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedMenuHeight = Math.min(288, normalizedOptions.length * 44);
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(
        spaceBelow < Math.min(180, estimatedMenuHeight) && rect.top > spaceBelow,
      );
    }
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(option) {
    if (option.disabled) return;
    onChange?.({ target: { value: String(option.value) } });
    setOpen(false);
    triggerRef.current?.focus();
  }

  function moveActiveIndex(direction) {
    const enabledIndexes = normalizedOptions
      .map((option, index) => (option.disabled ? -1 : index))
      .filter((index) => index >= 0);
    if (enabledIndexes.length === 0) return;
    const currentPosition = enabledIndexes.indexOf(activeIndex);
    const nextPosition = currentPosition < 0
      ? 0
      : (currentPosition + direction + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPosition]);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        showMenu();
      } else {
        moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return;
      event.preventDefault();
      const enabledIndexes = normalizedOptions
        .map((option, index) => (option.disabled ? -1 : index))
        .filter((index) => index >= 0);
      if (enabledIndexes.length) {
        setActiveIndex(event.key === 'Home' ? enabledIndexes[0] : enabledIndexes.at(-1));
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) showMenu();
      else if (normalizedOptions[activeIndex]) selectOption(normalizedOptions[activeIndex]);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase();
      window.clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = window.setTimeout(() => {
        typeaheadRef.current = '';
      }, 500);
      const start = Math.max(selectedIndex, 0);
      for (let offset = 1; offset <= normalizedOptions.length; offset += 1) {
        const index = (start + offset) % normalizedOptions.length;
        const option = normalizedOptions[index];
        if (
          !option.disabled &&
          String(option.label).toLocaleLowerCase().startsWith(typeaheadRef.current)
        ) {
          setActiveIndex(index);
          setOpen(true);
          break;
        }
      }
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      {label && (
        <label id={labelId} htmlFor={id} className="label">
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : label ? `${labelId} ${valueId}` : valueId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        className={`input flex min-h-11 items-center justify-between gap-3 text-left ${className}`}
        onClick={() => (open ? setOpen(false) : showMenu())}
        onKeyDown={handleKeyDown}
      >
        <span id={valueId} className="min-w-0 flex-1 truncate">
          {selectedOption?.label ?? placeholder ?? 'Selecciona una opción'}
        </span>
        <svg
          aria-hidden="true"
          className={`size-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          ref={listboxRef}
          id={listboxId}
          popover="manual"
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          className={`absolute z-50 w-full overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15 ${
            openAbove ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{ maxHeight: 'min(18rem, 40vh)' }}
        >
          {normalizedOptions.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              id={optionId(index)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              aria-disabled={option.disabled || undefined}
              tabIndex={-1}
              className={`flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-sm leading-5 transition-colors ${
                index === activeIndex
                  ? 'bg-slate-100 text-slate-900'
                  : String(option.value) === String(value)
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-700 hover:bg-slate-50'
              } ${option.disabled ? 'cursor-not-allowed text-slate-400' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span className="min-w-0 flex-1 break-words">{option.label}</span>
              {String(option.value) === String(value) && (
                <svg aria-hidden="true" className="ml-2 size-4 shrink-0" viewBox="0 0 20 20" fill="none">
                  <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
      {error && <p id={errorId} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
