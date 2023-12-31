import { useEffect, useState } from "react";
import { useDebounce } from "./useDebounce";
import { getPlaceAutocomplete } from "../services/getPlaceAutocomplete";
import { getPlaceDetails } from "../services/getPlaceDetails";
import { PlaceDetails } from "../types";
import { DEFAULT_COORDINATES } from "../utils/constants";

type Place = {
  name: string;
  id: string;
};

type Props = {
  onChange: (value: PlaceDetails) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
};

export const useLocationSearch = ({
  onChange,
  searchString,
  setSearchString,
}: Props) => {
  const [immediateValue, setImmediateValue] = useState(searchString || "");
  const debouncedValue = useDebounce(immediateValue, 500);
  const [predictions, setPredictions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowPlaces, setShouldShowPlaces] = useState(false);

  useEffect(() => {
    if (!debouncedValue) {
      setPredictions([]);
      setShouldShowPlaces(false);
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    getPlaceAutocomplete(debouncedValue).then((predictions) => {
      setPredictions(predictions);
      setIsLoading(false);
    });
  }, [debouncedValue]);

  const selectLocation = async (place: Place) => {
    setImmediateValue(place.name);
    const placeDetails = await getPlaceDetails(place.id);
    onChange(placeDetails);
    setSearchString(place.name);
    setShouldShowPlaces(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShouldShowPlaces(false);
    } else {
      setShouldShowPlaces(true);
    }
  };

  const handleClearSearch = () => {
    setImmediateValue("");
    onChange({
      address: "",
      coordinates: DEFAULT_COORDINATES,
    });
    setSearchString("");
  };

  return {
    immediateValue,
    setImmediateValue,
    handleKeyDown,
    handleClearSearch,
    shouldShowPlaces,
    isLoading,
    predictions,
    selectLocation,
  };
};
