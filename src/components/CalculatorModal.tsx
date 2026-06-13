import { useMemo, useState } from 'react';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  calculatorType?: 'Basic' | 'Scientific' | 'None';
}

const basicKeys = [
  'C', '⌫', '%', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '−',
  '1', '2', '3', '+',
  '0', '.', '=',
];

const advancedKeys = [
  'sin', 'cos', 'tan', 'π',
  'ln', 'log', '√', '^',
  '(', ')', 'e',
];

const CalculatorModal = ({ open, onClose, calculatorType = 'Scientific' }: CalculatorModalProps) => {
  const [display, setDisplay] = useState('0');
  const [replaceOnNextDigit, setReplaceOnNextDigit] = useState(true);
  const [advanced, setAdvanced] = useState(false);

  const canRender = useMemo(() => open, [open]);

  type Token =
    | { type: 'number'; value: number }
    | { type: 'name'; value: string }
    | { type: 'op'; value: string }
    | { type: 'lparen' }
    | { type: 'rparen' };

  const normalizeExpression = (expr: string) => {
    return expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\s+/g, '');
  };

  const tokenize = (expr: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch >= '0' && ch <= '9' || ch === '.') {
        let j = i + 1;
        while (j < expr.length) {
          const cj = expr[j];
          if ((cj >= '0' && cj <= '9') || cj === '.') {
            j += 1;
            continue;
          }
          break;
        }
        const raw = expr.slice(i, j);
        const n = Number(raw);
        if (!Number.isFinite(n)) throw new Error('Invalid number');
        tokens.push({ type: 'number', value: n });
        i = j;
        continue;
      }
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
        let j = i + 1;
        while (j < expr.length) {
          const cj = expr[j];
          if ((cj >= 'a' && cj <= 'z') || (cj >= 'A' && cj <= 'Z') || (cj >= '0' && cj <= '9') || cj === '_') {
            j += 1;
            continue;
          }
          break;
        }
        tokens.push({ type: 'name', value: expr.slice(i, j) });
        i = j;
        continue;
      }
      if (ch === '(') {
        tokens.push({ type: 'lparen' });
        i += 1;
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'rparen' });
        i += 1;
        continue;
      }
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '^') {
        tokens.push({ type: 'op', value: ch });
        i += 1;
        continue;
      }
      throw new Error('Unexpected character');
    }
    return tokens;
  };

  const addImplicitMultiplication = (tokens: Token[]) => {
    const out: Token[] = [];
    const isFunctionName = (t: Token) => t.type === 'name' && ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(t.value);

    const canEndTerm = (t: Token) => {
      return t.type === 'number' || (t.type === 'name' && !isFunctionName(t)) || t.type === 'rparen';
    };

    const canStartTerm = (t: Token) => {
      return t.type === 'number' || t.type === 'lparen' || t.type === 'name';
    };

    for (let i = 0; i < tokens.length; i += 1) {
      const cur = tokens[i];
      const prev = out[out.length - 1];
      if (prev && canEndTerm(prev) && canStartTerm(cur)) {
        const prevIsFn = isFunctionName(prev);
        const curIsLParen = cur.type === 'lparen';
        if (!(prevIsFn && curIsLParen)) {
          out.push({ type: 'op', value: '*' });
        }
      }
      out.push(cur);
    }
    return out;
  };

  const toRpn = (tokens: Token[]): Token[] => {
    const out: Token[] = [];
    const stack: Token[] = [];

    const prec = (op: string) => {
      switch (op) {
        case 'u-':
          return 5;
        case '^':
          return 4;
        case '*':
        case '/':
        case '%':
          return 3;
        case '+':
        case '-':
          return 2;
        default:
          return 0;
      }
    };

    const rightAssoc = (op: string) => op === '^' || op === 'u-';
    const isFunction = (t: Token) => t.type === 'name' && ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(t.value);

    let prev: Token | null = null;
    for (const t of tokens) {
      if (t.type === 'number') {
        out.push(t);
        prev = t;
        continue;
      }

      if (t.type === 'name') {
        stack.push(t);
        prev = t;
        continue;
      }

      if (t.type === 'op') {
        let op = t.value;
        const prevIsOpOrLParen =
          prev === null || prev.type === 'op' || prev.type === 'lparen' || (prev.type === 'name' && isFunction(prev));
        if (op === '-' && prevIsOpOrLParen) op = 'u-';

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.type === 'op') {
            const topOp = top.value;
            const shouldPop = rightAssoc(op) ? prec(op) < prec(topOp) : prec(op) <= prec(topOp);
            if (shouldPop) {
              out.push(stack.pop()!);
              continue;
            }
          }
          if (isFunction(top)) {
            out.push(stack.pop()!);
            continue;
          }
          break;
        }
        stack.push({ type: 'op', value: op });
        prev = t;
        continue;
      }

      if (t.type === 'lparen') {
        stack.push(t);
        prev = t;
        continue;
      }

      if (t.type === 'rparen') {
        while (stack.length > 0 && stack[stack.length - 1].type !== 'lparen') {
          out.push(stack.pop()!);
        }
        if (stack.length === 0) throw new Error('Mismatched parentheses');
        stack.pop();
        if (stack.length > 0 && isFunction(stack[stack.length - 1])) {
          out.push(stack.pop()!);
        }
        prev = t;
        continue;
      }
    }

    while (stack.length > 0) {
      const t = stack.pop()!;
      if (t.type === 'lparen' || t.type === 'rparen') throw new Error('Mismatched parentheses');
      out.push(t);
    }
    return out;
  };

  const evalRpn = (rpn: Token[]) => {
    const stack: number[] = [];
    const applyFn = (fn: string, x: number) => {
      switch (fn) {
        case 'sin':
          return Math.sin(x);
        case 'cos':
          return Math.cos(x);
        case 'tan':
          return Math.tan(x);
        case 'log':
          return Math.log10(x);
        case 'ln':
          return Math.log(x);
        case 'sqrt':
          return Math.sqrt(x);
        default:
          throw new Error('Unknown function');
      }
    };

    for (const t of rpn) {
      if (t.type === 'number') {
        stack.push(t.value);
        continue;
      }
      if (t.type === 'name') {
        if (t.value === 'pi') {
          stack.push(Math.PI);
          continue;
        }
        if (t.value === 'e') {
          stack.push(Math.E);
          continue;
        }
        const x = stack.pop();
        if (x === undefined) throw new Error('Missing operand');
        stack.push(applyFn(t.value, x));
        continue;
      }
      if (t.type === 'op') {
        if (t.value === 'u-') {
          const x = stack.pop();
          if (x === undefined) throw new Error('Missing operand');
          stack.push(-x);
          continue;
        }
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error('Missing operand');
        switch (t.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            stack.push(b === 0 ? NaN : a / b);
            break;
          case '%':
            stack.push(a % b);
            break;
          case '^':
            stack.push(Math.pow(a, b));
            break;
          default:
            throw new Error('Unknown operator');
        }
        continue;
      }
    }

    if (stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
  };

  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return 'Error';
    const s = String(n);
    if (s.length <= 14) return s;
    return n.toPrecision(10);
  };

  const evaluateDisplay = () => {
    const normalized = normalizeExpression(display)
      .replace(/π/g, 'pi');
    const tokens = addImplicitMultiplication(tokenize(normalized));
    const rpn = toRpn(tokens);
    const result = evalRpn(rpn);
    return result;
  };

  const isOperatorChar = (ch: string) => ['+', '−', '×', '÷', '%', '^'].includes(ch);

  const handleKey = (k: string) => {
    if (k === 'C') {
      setDisplay('0');
      setReplaceOnNextDigit(true);
      return;
    }

    if (k === '⌫') {
      if (replaceOnNextDigit) return;
      setDisplay(prev => {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      });
      return;
    }

    if (k === '=') {
      try {
        const result = evaluateDisplay();
        setDisplay(formatNumber(result));
        setReplaceOnNextDigit(true);
      } catch {
        setDisplay('Error');
        setReplaceOnNextDigit(true);
      }
      return;
    }

    if (k === '+' || k === '−' || k === '×' || k === '÷' || k === '%' || k === '^') {
      setDisplay(prev => {
        const base = replaceOnNextDigit ? prev : prev;
        if (base === 'Error') return '0' + k;
        if (base.length === 0) return '0' + k;
        const last = base.slice(-1);
        if (isOperatorChar(last)) {
          setReplaceOnNextDigit(true);
          return base.slice(0, -1) + k;
        }
        setReplaceOnNextDigit(true);
        return base + k;
      });
      return;
    }

    if (advanced) {
      if (k === 'sin' || k === 'cos' || k === 'tan' || k === 'ln' || k === 'log') {
        setDisplay(prev => {
          const next = (replaceOnNextDigit || prev === '0' || prev === 'Error') ? `${k}(` : `${prev}${k}(`;
          setReplaceOnNextDigit(false);
          return next;
        });
        return;
      }
      if (k === '√') {
        setDisplay(prev => {
          const next = (replaceOnNextDigit || prev === '0' || prev === 'Error') ? 'sqrt(' : `${prev}sqrt(`;
          setReplaceOnNextDigit(false);
          return next;
        });
        return;
      }
      if (k === 'π') {
        setDisplay(prev => {
          const next = (replaceOnNextDigit || prev === '0' || prev === 'Error') ? 'π' : `${prev}π`;
          setReplaceOnNextDigit(false);
          return next;
        });
        return;
      }
      if (k === 'e') {
        setDisplay(prev => {
          const next = (replaceOnNextDigit || prev === '0' || prev === 'Error') ? 'e' : `${prev}e`;
          setReplaceOnNextDigit(false);
          return next;
        });
        return;
      }
      if (k === '(' || k === ')') {
        setDisplay(prev => {
          const next = (replaceOnNextDigit || prev === 'Error') ? k : `${prev}${k}`;
          setReplaceOnNextDigit(false);
          return next;
        });
        return;
      }
    }

    // digits + dot
    if (k === '.') {
      setDisplay(prev => {
        if (replaceOnNextDigit) {
          setReplaceOnNextDigit(false);
          return '0.';
        }
        if (prev.split(/[^0-9.]/).pop()?.includes('.')) return prev;
        return prev + '.';
      });
      return;
    }

    // digit
    setDisplay(prev => {
      if (replaceOnNextDigit || prev === '0' || prev === 'Error') {
        setReplaceOnNextDigit(false);
        return k;
      }
      return prev + k;
    });
  };

  if (!canRender) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
        aria-label="Close calculator"
      />

      <div className="relative w-full max-w-sm liquid-glass liquid-glass--purple p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold leading-5 text-[#111827]">Calculator</div>
          <div className="flex items-center gap-3">
            {calculatorType !== 'Basic' && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setAdvanced(v => !v)}
                  className={advanced ? 'toggle toggle--on' : 'toggle'}
                  role="switch"
                  aria-checked={advanced}
                  aria-label="Toggle advanced calculator"
                >
                  <span className="toggle__knob" />
                </button>
                <span className="mt-1 text-[11px] leading-none text-[#6B7280]">Advanced</span>
              </div>
            )}

          <button type="button" onClick={onClose} className="ios-btn ios-btn--light">
            Close
          </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3">
          <div className="text-right text-3xl font-semibold leading-[1.1] text-[#111827] truncate">
            {display}
          </div>
        </div>

        {advanced && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {advancedKeys.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className="ios-btn ios-btn--light"
              >
                {k}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {basicKeys.map(k => {
            const isPrimary = k === '=' || k === '÷' || k === '×' || k === '−' || k === '+';
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className={
                  k === '0'
                    ? `col-span-2 ${isPrimary ? 'ios-btn ios-btn--primary' : 'ios-btn ios-btn--light'}`
                    : isPrimary
                      ? 'ios-btn ios-btn--primary'
                      : 'ios-btn ios-btn--light'
                }
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
