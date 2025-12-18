"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  disabled = false,
  className = "",
  label,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const [isMounted, setIsMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  // Filter options based on search term
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group options
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const group = opt.group || "default";
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, Option[]>);

  // Handle position update
  useLayoutEffect(() => {
    if (isOpen) {
      const update = () => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();

        // Simple heuristic: check vertical space center-point
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldFlip = spaceBelow < 400 && rect.top > spaceBelow;

        if (shouldFlip) {
          setDropdownStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            // Position the top of the element at the top of the input
            top: rect.top - 4,
            // Then translate up 100%
            transform: "translateY(-100%)",
          });
        } else {
          setDropdownStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            top: rect.bottom + 4,
          });
        }
      };

      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true); // true for capturing scroll events from parents

      // Sync highlighted index with selection on open
      const selectedIndex = options.findIndex((opt) => opt.value === value);
      if (selectedIndex >= 0) {
        // We need to find index in filteredOptions, but here we assume initially it matches
        // Actually, better to check filteredOptions if we can.
        // But inside this effect, filteredOptions might be stale if defined outside.
        // Let's just rely on a separate effect for index syncing or do it here if possible.
      }

      return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }
  }, [isOpen, options, value]);

  // Sync highlighted index explicitly when opening
  useEffect(() => {
    if (isOpen) {
      const idx = filteredOptions.findIndex((o) => o.value === value);
      if (idx >= 0) setHighlightedIndex(idx);
      else setHighlightedIndex(0);
    }
  }, [isOpen, filteredOptions, value]); // Only run when isOpen changes to true

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside input container
      const isInput = containerRef.current?.contains(target);

      // Check if click is inside dropdown portal
      const isDropdown = dropdownRef.current?.contains(target);

      if (!isInput && !isDropdown) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border border-sky-100 rounded-2xl focus:border-sky-400 focus:ring-2 focus:ring-sky-300 focus:ring-offset-0 text-base text-slate-900 placeholder:text-slate-400 shadow-sm transition ${
            disabled
              ? "bg-slate-100 cursor-not-allowed text-slate-500 placeholder:text-slate-400"
              : "bg-white"
          } ${className}`}
          autoComplete="off"
        />

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Portal Dropdown */}
      {isOpen &&
        !disabled &&
        isMounted &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              ...dropdownStyle,
              zIndex: 9999, // Ensure it's on top of everything
            }}
            // shadow-xl shadow-sky-100 from original
          >
            <div className="max-h-96 w-full overflow-auto rounded-2xl border border-sky-100 bg-white shadow-xl shadow-sky-100">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  No results found
                </div>
              ) : (
                Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <div key={group}>
                    {group !== "default" && (
                      <div className="sticky top-0 z-10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group}
                      </div>
                    )}
                    {groupOptions.map((option) => {
                      const globalIndex = filteredOptions.indexOf(option);
                      const isSelected = value === option.value;
                      const isHighlighted = globalIndex === highlightedIndex;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`w-full px-4 py-2 text-left transition-colors flex items-center justify-between ${
                            isHighlighted
                              ? isSelected
                                ? "bg-sky-100"
                                : "bg-slate-50"
                              : isSelected
                              ? "bg-sky-50"
                              : "bg-white"
                          } ${
                            isSelected
                              ? "font-medium text-sky-700"
                              : "text-slate-900"
                          }`}
                          onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        >
                          <span>{option.label}</span>
                          {isSelected && (
                            <span className="text-sky-600">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
