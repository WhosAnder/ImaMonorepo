import React, { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          className={cn(
            "min-h-[42px] w-full px-3 py-2 border rounded-md shadow-sm bg-white cursor-pointer flex flex-wrap gap-2 items-center",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {value.length === 0 && (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}

          {value.map((val) => {
            const option = options.find((o) => o.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              >
                {option?.label || val}
                <button
                  type="button"
                  onClick={(e) => removeValue(val, e)}
                  className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <div className="flex-grow flex justify-end ml-auto">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No se encontraron resultados
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50",
                        isSelected && "bg-blue-50 text-blue-700",
                      )}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
