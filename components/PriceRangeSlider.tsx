"use client";

const LABELS = ["무료", "저렴 ₩", "보통 ₩₩", "비쌈 ₩₩₩", "매우비쌈 ₩₩₩₩"];

type Props = {
  min: number;
  max: number;
  ignore: boolean;
  includeUnknown: boolean;
  onChange: (v: { min: number; max: number; ignore: boolean; includeUnknown: boolean }) => void;
};

export default function PriceRangeSlider({ min, max, ignore, includeUnknown, onChange }: Props) {
  const disabled = ignore;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 w-16">가격대</span>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={ignore}
            onChange={(e) =>
              onChange({ min, max, ignore: e.target.checked, includeUnknown })
            }
          />
          상관없음
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeUnknown}
            onChange={(e) =>
              onChange({ min, max, ignore, includeUnknown: e.target.checked })
            }
          />
          가격정보 없음도 포함
        </label>
      </div>
      <div className={`flex items-center gap-2 ${disabled ? "opacity-40" : ""}`}>
        <select
          disabled={disabled}
          value={min}
          onChange={(e) =>
            onChange({
              min: Number(e.target.value),
              max: Math.max(Number(e.target.value), max),
              ignore,
              includeUnknown,
            })
          }
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {LABELS.map((lb, i) => (
            <option key={i} value={i}>
              {lb}
            </option>
          ))}
        </select>
        <span className="text-gray-400">~</span>
        <select
          disabled={disabled}
          value={max}
          onChange={(e) =>
            onChange({
              min: Math.min(min, Number(e.target.value)),
              max: Number(e.target.value),
              ignore,
              includeUnknown,
            })
          }
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {LABELS.map((lb, i) => (
            <option key={i} value={i}>
              {lb}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-gray-400">
        구글 Places의 price_level (0~4) 근사치 기준입니다.
      </p>
    </div>
  );
}
