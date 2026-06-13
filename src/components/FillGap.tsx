import type { FillGapProps } from './types';

const FillGap = ({ text, gapId, value, onChange }: FillGapProps) => {
  // Split the question text by the [GAP] indicator
  const parts = text.split('[GAP]');
  
  // Maintain an array of values for each gap. 
  // We use ',,,' as a robust separator to avoid issues if students type commas.
  const values = value ? value.split(',,,') : Array(Math.max(parts.length - 1, 0)).fill('');

  const handleChange = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    // Join back into a single string for state management
    onChange(gapId, newValues.join(',,,'));
  };

  return (
    <div className="mb-4">
      <p className="q-text leading-9 text-lg">
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <input
                type="text"
                className="q-input mx-2 px-4 py-1.5 rounded-xl text-center w-32 focus:w-48 transition-all inline-block align-middle font-bold border-b-2"
                placeholder="______"
                value={values[index] || ''}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            )}
          </span>
        ))}
      </p>
    </div>
  );
};

export default FillGap;
