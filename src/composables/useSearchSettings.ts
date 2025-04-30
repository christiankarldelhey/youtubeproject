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
        { value: 'travel', icon: 'MapIcon' },
        { value: 'food', icon: 'Utensils' },
        { value: 'hotel', icon: 'Bed' },
        { value: 'hiking', icon: 'Tent' },
        { value: 'budget', icon: 'CircleDollarSign' },
        { value: 'history', icon: 'Scroll' },
      ];

    return {
        searchOptions,
        iconMap,
    };
}
