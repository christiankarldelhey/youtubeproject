import { Utensils, Bed, Tent, CircleDollarSign, MapIcon, Scroll } from 'lucide-vue-next';

export function useSearchSettings() {

    const iconMap = {
        MapIcon,
        Utensils,
        Bed,
        Tent,
        CircleDollarSign,
        Scroll,
    };

    const searchOptions = [
        { value: 'travel', label: 'Travel', icon: 'MapIcon' },
        { value: 'food', label: 'Gastronomy', icon: 'Utensils' },
        { value: 'hotel', label: 'Accomodation', icon: 'Bed' },
        { value: 'hiking', label: 'Hiking (Outdoors)', icon: 'Tent' },
        { value: 'budget', label: 'Travel on a budget', icon: 'CircleDollarSign' },
        { value: 'history', label: 'History', icon: 'Scroll' },
      ];

    return {
        searchOptions,
        iconMap,
    };
}
