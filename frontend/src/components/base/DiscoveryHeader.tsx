import { useState } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface DiscoveryHeaderProps {
  genre: FilterOption[];
  ratings: FilterOption[];
  type: FilterOption[];
  certificate: FilterOption[];
  onFilterChange: (filters: {
    genre?: string;
    rating?: string;
    type?: string;
    certificate?: string;
  }) => void;
}

const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({
  genre,
  ratings,
  type,
  certificate,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState({
    genre: "",
    rating: "",
    type: "",
    certificate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>, filterType: string) => {
    const value = e.target.value;

    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [filterType]: value };
      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  return (
    <div className="rounded-lg shadow-sm px-4">
      <div className="flex flex-col md:flex-row items-center justify-between">
        {/* Genre Filter */}
        <select
          className={`w-full max-w-[250px] h-12 text-sm font-light tracking-wide text-center uppercase align-middle rounded-full px-3
            border cursor-pointer bg-gray-500 border-black hover:bg-gray-600 text-white overflow-auto custom-scrollbar`}
          value={filters.genre}
          onChange={(e) => handleChange(e, "genre")}
        >
          <option value="">Select Genre</option>
          {genre.map((genre) => (
            <option key={genre.value} value={genre.value}>
              {genre.label}
            </option>
          ))}
        </select>

        {/* Rating Filter */}
        <select
          className={`w-full max-w-[250px] h-12 text-sm font-light tracking-wide text-center uppercase align-middle rounded-full px-3
            border cursor-pointer bg-gray-500 border-black hover:bg-gray-600 text-white overflow-auto custom-scrollbar`}
          value={filters.rating}
          onChange={(e) => handleChange(e, "rating")}
        >
          <option value="">Select Rating</option>
          {ratings.map((rating) => (
            <option key={rating.value} value={rating.value}>
              {rating.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          className={`w-full max-w-[250px] h-12 text-sm font-light tracking-wide text-center uppercase align-middle rounded-full px-3
            border cursor-pointer bg-gray-500 border-black hover:bg-gray-600 text-white overflow-auto custom-scrollbar`}
          value={filters.type}
          onChange={(e) => handleChange(e, "type")}
        >
          <option value="">Select Type</option>
          {type.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Certificate Filter */}
        <select
          className={`w-full max-w-[250px] h-12 text-sm font-light tracking-wide text-center uppercase align-middle rounded-full px-3
            border cursor-pointer bg-gray-500 border-black hover:bg-gray-600 text-white overflow-auto custom-scrollbar`}
          value={filters.certificate}
          onChange={(e) => handleChange(e, "certificate")}
        >
          <option value="">Select Certificate</option>
          {certificate.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DiscoveryHeader;
