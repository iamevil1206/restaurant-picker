"use client";

const RADII = [100, 200, 500, 1000, 2000] as const;

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export default function RadiusSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">반경</span>
      {RADII.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`rounded-full px-3 py-1 text-sm border transition ${
            value === r
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          {r >= 1000 ? `${r / 1000}km` : `${r}m`}
        </button>
      ))}
    </div>
  );
}
