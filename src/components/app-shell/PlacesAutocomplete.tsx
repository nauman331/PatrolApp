import { useEffect, useRef, useState, useCallback } from "react";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text?: string;
  };
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect: (address: string, lat: string, lng: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Address *",
  className = "",
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // These are stable google.maps service instances
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const attributionRef = useRef<HTMLDivElement>(null);

  // Init services once the google script is ready
  useEffect(() => {
    const init = () => {
      if (!window.google?.maps?.places) return;
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // PlacesService needs a DOM node (can be hidden)
      if (attributionRef.current) {
        placesService.current = new google.maps.places.PlacesService(attributionRef.current);
      }
    };

    if (window.google?.maps?.places) {
      init();
    } else {
      // Wait for the script to load
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          init();
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback((input: string) => {
    if (!input || input.length < 3 || !autocompleteService.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        // Bias toward Pakistan — remove if you want global results
        locationBias: new google.maps.Circle({
          center: { lat: 30.3753, lng: 69.3451 },
          radius: 1500000,
        }),
      },
      (predictions, status) => {
        setLoading(false);
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setSuggestions(predictions as unknown as Prediction[]);
          setOpen(true);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      }
    );
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = useCallback(
    (prediction: Prediction) => {
      onChange(prediction.description);
      setOpen(false);
      setSuggestions([]);

      if (!placesService.current) {
        onSelect(prediction.description, "", "");
        return;
      }

      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["geometry"],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            onSelect(
              prediction.description,
              String(place.geometry.location.lat()),
              String(place.geometry.location.lng())
            );
          } else {
            onSelect(prediction.description, "", "");
          }
        }
      );
    },
    [onChange, onSelect]
  );

  return (
    <div ref={wrapperRef} className="relative mb-4 z-50">
      {/* Hidden div required by PlacesService */}
      <div ref={attributionRef} className="hidden" />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        className={`w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none ${className}`}
      />

      {/* Spinner */}
      {loading && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      )}

      {/* Dropdown */}
      {open && (suggestions.length > 0 || loading) && (
        <ul className="absolute left-0 right-0 top-full z-[100000] mt-1 overflow-hidden rounded-2xl border border-hairline bg-white shadow-xl max-h-96 overflow-y-auto">
          {suggestions.length === 0 && loading && (
            <li className="px-5 py-3 text-sm text-ink/50">Loading suggestions...</li>
          )}
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              className="flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-surface-muted transition-colors"
            >
              <span className="mt-0.5 text-base flex-shrink-0">📍</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {s.structured_formatting.main_text}
                </p>
                {s.structured_formatting.secondary_text && (
                  <p className="truncate text-xs text-ink/50">
                    {s.structured_formatting.secondary_text}
                  </p>
                )}
              </div>
            </li>
          ))}

          {/* Required Google attribution */}
          {suggestions.length > 0 && (
            <li className="flex items-center justify-end gap-1 border-t border-hairline px-4 py-2 bg-zinc-50">
              <span className="text-[10px] text-ink/40">powered by</span>
              <img
                src="https://developers.google.com/static/maps/documentation/images/google_on_white.png"
                alt="Google"
                className="h-3 opacity-60"
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}