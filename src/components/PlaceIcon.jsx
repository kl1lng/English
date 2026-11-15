import React from "react";
import {
  Bird,
  BookOpenText,
  Building2,
  Compass,
  Crown,
  Flower2,
  Landmark,
  MapPinned,
  Mountain,
  Music2,
  SatelliteDish,
  ShieldCheck,
  Tent,
  Trophy,
  TreePine,
  Trees,
  Utensils,
  Users,
  Route,
  Leaf,
  Waves,
} from "lucide-react";

const placeIcons = {
  map: MapPinned,
  city: Building2,
  route: Route,
  landmark: Landmark,
  tent: Tent,
  music: Music2,
  food: Utensils,
  trees: Trees,
  waves: Waves,
  mountain: Mountain,
  satellite: SatelliteDish,
  bird: Bird,
  trophy: Trophy,
  flower: Flower2,
  book: BookOpenText,
  crown: Crown,
  shield: ShieldCheck,
  leaf: Leaf,
  users: Users,
  compass: Compass,
  tree: TreePine,
};
export default function PlaceIcon({ name, size = 18, ...props }) {
  const Icon = placeIcons[name] || MapPinned;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
