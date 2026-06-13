import type { QuestionOptionProps } from './types';

const QuestionOption = ({ type, children, selected, onClick }: QuestionOptionProps) => {
  return (
    <label 
      className={
        `q-option flex items-center p-4 rounded-2xl cursor-pointer transition-all ` +
        (selected ? 'q-option--selected' : '')
      }
    >
      <input 
        type={type} 
        className="form-radio h-5 w-5 text-[#2B1A66]" 
        checked={selected}
        onChange={onClick}
      />
      <span className="ml-4 q-text">{children}</span>
    </label>
  );
};

export default QuestionOption;
