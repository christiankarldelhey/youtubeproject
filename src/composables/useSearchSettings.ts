import { Utensils, Bed, Tent, CircleDollarSign, MapIcon } from 'lucide-vue-next';

export function useSearchSettings() {

    const iconMap = {
        MapIcon,
        Utensils,
        Bed,
        Tent,
        CircleDollarSign,
    };

    const searchOptions = [
        { value: 'travel', label: 'Travel (general travel videos)', icon: 'MapIcon' },
        { value: 'food', label: 'Gastronomy', icon: 'Utensils' },
        { value: 'hotel', label: 'Accomodation', icon: 'Bed' },
        { value: 'hiking', label: 'Hiking (Outdoors)', icon: 'Tent' },
        { value: 'budget', label: 'Travel on a budget', icon: 'CircleDollarSign' },
      ];

    return {
        searchOptions,
        iconMap,
    };
}
