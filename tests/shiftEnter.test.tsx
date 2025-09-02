import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe,it,expect } from 'vitest';
import { EditableBlock } from '../src/components/EditableBlock';

// Helper to start editing: double click
function startEditing(container: HTMLElement){
  fireEvent.doubleClick(container.querySelector('[role="textbox"]')!);
}

describe('Shift+Enter behavior', () => {
  it('adds newline with Shift+Enter and confirms with Enter', () => {
    let val = '';
    const { container } = render(<EditableBlock value={val} onChange={v=>val=v} placeholder="Test" multiline />);
    const box = container.querySelector('[role="textbox"]')!;
    startEditing(container);
    const ta = container.querySelector('textarea')!;
    fireEvent.change(ta,{ target:{ value:'Linea 1' }});
    fireEvent.keyDown(ta,{ key:'Enter', shiftKey:true });
    fireEvent.change(ta,{ target:{ value:'Linea 1\nLinea 2' }});
    fireEvent.keyDown(ta,{ key:'Enter' }); // confirm
    expect(val).toBe('Linea 1\nLinea 2');
  });
});
