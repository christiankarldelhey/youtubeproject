import { Luggage, Utensils, Bed, Tent, PiggyBank } from 'lucide-vue-next';

export function useSearchSettings() {

    const iconMap = {
        Luggage,
        Utensils,
        Bed,
        Tent,
        PiggyBank,
    };

    const searchOptions = [
        { value: 'travel', label: 'Travel (general travel videos)', icon: 'Luggage' },
        { value: 'food', label: 'Gastronomy', icon: 'Utensils' },
        { value: 'hotel', label: 'Accomodation', icon: 'Bed' },
        { value: 'hiking', label: 'Hiking (Outdoors)', icon: 'Tent' },
        { value: 'budget', label: 'Travel on a budget', icon: 'PiggyBank' },
      ];

    return {
        searchOptions,
        iconMap,
    };
}
