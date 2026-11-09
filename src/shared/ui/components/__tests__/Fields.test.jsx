import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectField } from '../Fields.jsx';

describe('SelectField', () => {
  it('opens a compact listbox and reports the selected value', () => {
    const onChange = vi.fn();
    render(
      <SelectField
        label="Tipo de lesión"
        value=""
        placeholder="Seleccione el tipo de lesión"
        onChange={onChange}
        options={[
          { value: 'articular', label: 'Articular' },
          { value: 'muscular', label: 'Muscular' },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: /tipo de lesión/i }));

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveStyle({ maxHeight: 'min(18rem, 40vh)' });
    expect(screen.getByRole('option', { name: 'Articular' })).toBeVisible();

    fireEvent.click(screen.getByRole('option', { name: 'Muscular' }));

    expect(onChange).toHaveBeenCalledWith({ target: { value: 'muscular' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and escape dismissal', () => {
    const onChange = vi.fn();
    render(
      <SelectField
        aria-label="Fase"
        value="aguda"
        onChange={onChange}
        options={[
          { value: 'aguda', label: 'Aguda' },
          { value: 'subaguda', label: 'Subaguda' },
        ]}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Fase' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith({ target: { value: 'subaguda' } });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
