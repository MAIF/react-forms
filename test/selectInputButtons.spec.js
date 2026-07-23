import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';

import { SelectInput } from '../src/inputs/SelectInput';

const Wrapper = ({ children }) => {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
};

const renderButtons = (props) =>
  render(
    <Wrapper>
      <SelectInput
        buttons
        className="mrf-btn"
        schema={{}}
        {...props}
      />
    </Wrapper>
  );

describe('SelectInput buttons format', () => {
  it('emits onChange when a regular option is clicked', () => {
    const onChange = sinon.spy();

    renderButtons({
      onChange,
      possibleValues: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
    });

    fireEvent.click(screen.getByText('One'));

    expect(onChange).to.have.been.calledOnceWith('one');
  });

  it('does not emit onChange and marks the button disabled for a disabled option', () => {
    const onChange = sinon.spy();

    renderButtons({
      onChange,
      possibleValues: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two', disabled: true },
      ],
    });

    const disabledButton = screen.getByText('Two');

    expect(disabledButton.disabled).to.equal(true);
    expect(disabledButton.getAttribute('aria-disabled')).to.equal('true');

    fireEvent.click(disabledButton);

    expect(onChange).to.not.have.been.called();
  });
});
