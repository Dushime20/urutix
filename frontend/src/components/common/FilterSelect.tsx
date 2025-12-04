import React from "react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  label?: string | React.ReactNode;
  value: string;
  placeholder?: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
  selectClassName?: string;
  name?: string;
  "aria-label"?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  icon,
  className = "",
  selectClassName = "",
  name,
  "aria-label": ariaLabel,
}) => {
  const computedPlaceholder =
    placeholder ?? label ?? (options[0]?.label ?? "Select option");

  return (
    <label
      className={`filter-select-wrapper ${className}`}
      aria-label={label ? undefined : ariaLabel}
    >
      {label ? <span className="filter-select-label">{typeof label === 'string' ? label : label}</span> : null}
      <div className="relative flex items-center">
        {icon ? (
          <span className="pointer-events-none absolute left-3 text-base text-slate-400">
            {icon}
          </span>
        ) : null}
        <select
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`filter-select ${icon ? "pl-10" : ""} ${selectClassName}`}
          data-icon={icon ? "true" : "false"}
          aria-label={ariaLabel}
        >
          <option value="">{computedPlaceholder}</option>
          {options
            .filter((option) => option.value !== "")
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
      </div>
    </label>
  );
};

export default FilterSelect;

